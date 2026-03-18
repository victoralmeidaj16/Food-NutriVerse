const crypto = require('crypto');
const fs = require('fs');

const SUPPORTED_JWS_ALGORITHMS = {
    ES256: 'sha256',
    ES384: 'sha384',
    ES512: 'sha512',
};

const MAX_CLOCK_SKEW_MS = 60 * 1000;

const base64UrlDecodeToBuffer = (value) => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (normalized.length % 4)) % 4;
    return Buffer.from(normalized + '='.repeat(padding), 'base64');
};

const base64UrlDecodeToJson = (value) => JSON.parse(base64UrlDecodeToBuffer(value).toString('utf8'));

const derToPem = (base64Der) => {
    const lines = base64Der.match(/.{1,64}/g) || [];
    return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
};

const extractPemCertificates = (input) => {
    if (!input || typeof input !== 'string') return [];
    return input.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];
};

const readCertificatesFromFiles = (value) => {
    if (!value || typeof value !== 'string') return [];
    return value
        .split(',')
        .map((file) => file.trim())
        .filter(Boolean)
        .flatMap((filePath) => {
            try {
                return extractPemCertificates(fs.readFileSync(filePath, 'utf8'));
            } catch (error) {
                console.error(`Failed to read certificate file: ${filePath}`, error);
                return [];
            }
        });
};

const loadTrustedAppleRoots = () => {
    const fromEnv = extractPemCertificates(process.env.APPLE_ROOT_CA_PEMS || '');
    const fromFiles = readCertificatesFromFiles(process.env.APPLE_ROOT_CA_FILES || '');
    const certificates = [...fromEnv, ...fromFiles];

    return certificates.map((pem) => new crypto.X509Certificate(pem));
};

const assertCertificateValidity = (certificate, effectiveDate) => {
    const validFrom = new Date(certificate.validFrom).getTime();
    const validTo = new Date(certificate.validTo).getTime();
    const time = effectiveDate.getTime();

    if (Number.isNaN(validFrom) || Number.isNaN(validTo)) {
        throw new Error('Certificate has invalid validity dates');
    }

    if (validFrom > time + MAX_CLOCK_SKEW_MS || validTo < time - MAX_CLOCK_SKEW_MS) {
        throw new Error('Certificate is not valid at the effective date');
    }
};

const joseToDer = (signature) => {
    const raw = Buffer.isBuffer(signature) ? signature : Buffer.from(signature);
    const componentLength = raw.length / 2;

    if (!Number.isInteger(componentLength) || componentLength <= 0) {
        throw new Error('Invalid JOSE signature length');
    }

    const components = [raw.subarray(0, componentLength), raw.subarray(componentLength)];
    const encoded = components.map((component) => {
        let i = 0;
        while (i < component.length - 1 && component[i] === 0) i += 1;
        let normalized = component.subarray(i);
        if (normalized[0] & 0x80) {
            normalized = Buffer.concat([Buffer.from([0]), normalized]);
        }
        return Buffer.concat([Buffer.from([0x02, normalized.length]), normalized]);
    });

    const sequenceLength = encoded.reduce((sum, item) => sum + item.length, 0);
    return Buffer.concat([Buffer.from([0x30, sequenceLength]), ...encoded]);
};

const verifyCertificateChain = ({ leaf, intermediate, trustedRoots, effectiveDate, rootFromHeader }) => {
    assertCertificateValidity(leaf, effectiveDate);
    assertCertificateValidity(intermediate, effectiveDate);

    if (!leaf.verify(intermediate.publicKey) || leaf.issuer !== intermediate.subject) {
        throw new Error('Leaf certificate was not issued by the intermediate certificate');
    }

    const trustedRoot = trustedRoots.find((root) => {
        try {
            return intermediate.verify(root.publicKey) && intermediate.issuer === root.subject;
        } catch (error) {
            return false;
        }
    });

    if (!trustedRoot) {
        throw new Error('Intermediate certificate is not anchored to a trusted Apple root');
    }

    assertCertificateValidity(trustedRoot, effectiveDate);

    if (rootFromHeader && trustedRoot.raw.compare(rootFromHeader.raw) !== 0) {
        throw new Error('Root certificate in x5c does not match a trusted Apple root');
    }

    return trustedRoot;
};

const verifyAndDecodeAppleJws = (signedValue, options = {}) => {
    if (!signedValue || typeof signedValue !== 'string') {
        throw new Error('Signed value is required');
    }

    const trustedRoots = loadTrustedAppleRoots();
    if (trustedRoots.length === 0) {
        throw new Error('No trusted Apple root certificates configured');
    }

    const parts = signedValue.split('.');
    if (parts.length !== 3) {
        throw new Error('Signed value is not a valid JWS compact string');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = base64UrlDecodeToJson(encodedHeader);
    const payload = base64UrlDecodeToJson(encodedPayload);

    if (!SUPPORTED_JWS_ALGORITHMS[header.alg]) {
        throw new Error(`Unsupported JWS algorithm: ${header.alg}`);
    }

    const x5c = Array.isArray(header.x5c) ? header.x5c : [];
    if (x5c.length < 2) {
        throw new Error('Apple JWS header does not contain a full x5c certificate chain');
    }

    const certificates = x5c.map((certificate) => new crypto.X509Certificate(derToPem(certificate)));
    const leaf = certificates[0];
    const intermediate = certificates[1];
    const rootFromHeader = certificates[2];
    const effectiveDate = options.effectiveDate || new Date(payload.signedDate || Date.now());

    verifyCertificateChain({
        leaf,
        intermediate,
        trustedRoots,
        effectiveDate,
        rootFromHeader,
    });

    const algorithm = SUPPORTED_JWS_ALGORITHMS[header.alg];
    const signature = joseToDer(base64UrlDecodeToBuffer(encodedSignature));
    const signingInput = Buffer.from(`${encodedHeader}.${encodedPayload}`);
    const verified = crypto.verify(algorithm, signingInput, leaf.publicKey, signature);

    if (!verified) {
        throw new Error('Apple JWS signature verification failed');
    }

    if (options.expectedBundleId && payload.bundleId && payload.bundleId !== options.expectedBundleId) {
        throw new Error('Apple JWS bundle identifier does not match expected bundle ID');
    }

    if (options.expectedEnvironment && payload.environment && payload.environment !== options.expectedEnvironment) {
        throw new Error('Apple JWS environment does not match expected environment');
    }

    if (
        options.expectedAppAppleId !== undefined &&
        payload.appAppleId !== undefined &&
        Number(payload.appAppleId) !== Number(options.expectedAppAppleId)
    ) {
        throw new Error('Apple JWS appAppleId does not match expected appAppleId');
    }

    return { header, payload, certificates };
};

module.exports = {
    loadTrustedAppleRoots,
    verifyAndDecodeAppleJws,
};
