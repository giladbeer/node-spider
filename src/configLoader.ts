import * as fs from 'fs';

export const loadConfig = (filePath: string) => {
  const configFile = fs.readFileSync(filePath);
  const jsonConfig = JSON.parse(configFile.toString());
  console.log(jsonConfig);
  return jsonConfig;
};
