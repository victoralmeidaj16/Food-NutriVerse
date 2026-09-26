# Branch — FitSwap

Atualizado em 25/09/2026.

## Configuração salva no Branch (Live)

- App ID: `1632190407435637723`.
- Domínio: `0mp77.app.link`.
- Domínio alternativo: `0mp77-alternate.app.link`.
- Scheme iOS/Android: `fitswap://`.
- Bundle ID e package: `com.victoralmeidaj16.foodnutriverse`.
- Apple App Prefix: `NT62CSCP9D`.
- App Store ID: `6755840672`, confirmado pela API pública da Apple com o mesmo bundle ID.
- URL iOS e fallback global: `https://apps.apple.com/br/app/fitswap/id6755840672` (Branch normaliza a URL iOS).
- Universal Links habilitados.
- NativeLink habilitado para todo tráfego iOS.
- Android App Links ainda desabilitados: faltam confirmar publicação Android e certificado SHA-256 de assinatura.

A associação pública em `https://0mp77.app.link/.well-known/apple-app-site-association` foi validada e inclui `NT62CSCP9D.com.victoralmeidaj16.foodnutriverse`.

## Configuração local

O arquivo ignorado `mobile-app/.env` contém a Branch Key Live e:

```dotenv
BRANCH_DOMAIN_LINK=0mp77.app.link
BRANCH_DOMAIN_LINK_ALT=0mp77-alternate.app.link
EXPO_PUBLIC_AFFILIATES_API_URL=https://afiliados-app.vercel.app
```

Não copiar a Branch Secret para o app. Nenhuma chave é registrada neste documento.

Validações realizadas: TypeScript do mobile sem erros, sete testes do painel de afiliados aprovados e introspecção Expo confirmando chave nativa, domínios universais e entitlements iOS.

## Produção configurada

- Usuário autorizou explicitamente o envio da Branch Key à Vercel e ao EAS e a republicação do painel.
- Vercel Production: `BRANCH_API_KEY`, `BRANCH_DOMAIN_LINK`, `BRANCH_DOMAIN_LINK_ALT` e `NEXT_PUBLIC_FITSWAP_APP_STORE_URL` salvas.
- Deployment republicado e pronto: `https://afiliados-2d8x58geg-victoralmeidaj16s-projects.vercel.app`, associado a `https://afiliados-app.vercel.app`.
- EAS Production: três variáveis Branch e `EXPO_PUBLIC_AFFILIATES_API_URL` salvas pelo painel. Branch Key com visibilidade Sensitive.
- Projeto Expo confirmado: `@victoraj16/mobile-app`, ID `fed4e9a4-ad21-43af-bfb6-e76330a74e2e`.
- Um afiliado FitSwap migrado. Link atual: `https://0mp77.app.link/I4ntqCdDJ6b`.
- API Branch confirmou o código do afiliado, `affiliate_app_id=fitswap` e fallback HTTPS no painel de produção. A página de convite respondeu HTTP 200 e contém o ID correto da App Store.
- Backup anterior à migração: `/private/tmp/fitswap-branch-links-backup.json` (arquivo temporário local).
- A primeira execução gerou um link com fallback localhost, substituído no Firebase por um novo link correto. O link descartado `https://0mp77.app.link/QMCAPG8CJ6b` não deve ser distribuído.

Ao executar novamente a migração, definir explicitamente `NEXT_PUBLIC_APP_URL=https://afiliados-app.vercel.app`; o `.env.local` do painel usa localhost para desenvolvimento.

## Pendências

1. Gerar um novo build nativo; uma atualização apenas JavaScript não inclui o SDK/configuração nativa. A CLI EAS ainda precisa de autenticação (o login realizado foi no navegador).
2. Validar em dispositivo: app instalado, instalação após clique e atribuição após login. A configuração do painel e os testes locais não comprovam esse fluxo completo.
3. Confirmar destino Android e certificado SHA-256 de assinatura para habilitar Android App Links.

Os links de cada afiliado já incluem seu fallback específico `/join/{codigo}` no backend. Não usar esse placeholder literalmente no fallback global do Branch.
