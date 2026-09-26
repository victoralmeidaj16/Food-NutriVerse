const { withDangerousMod, withXcodeProject, IOSConfig } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

/** Adds Branch NativeLink pasteboard configuration to generated iOS projects. */
module.exports = function withBranchNativeLink(config) {
  config = withDangerousMod(config, ['ios', async (config) => {
    const targetPath = path.join(
      config.modRequest.platformProjectRoot,
      config.modRequest.projectName,
      'branch.json'
    );
    const sourcePath = path.join(config.modRequest.projectRoot, 'config', 'branch.json');
    await fs.promises.copyFile(sourcePath, targetPath);
    return config;
  }]);

  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const fileName = 'branch.json';
    const resourcePath = `${config.modRequest.projectName}/${fileName}`;
    const fileReferences = project.pbxFileReferenceSection();
    const existing = Object.values(fileReferences).find((value) =>
      typeof value === 'object' && String(value.path).replaceAll('"', '').split('/').pop() === fileName
    );
    if (existing) {
      existing.path = `"${resourcePath}"`;
      existing.lastKnownFileType = 'text.json';
    }

    if (!existing) {
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: resourcePath,
        groupName: config.modRequest.projectName,
        project,
        isBuildFile: true,
      });
    }

    return config;
  });
};
