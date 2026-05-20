const { execSync } = require('child_process');

// 1. 获取当前要打包的子应用名称
const app = process.env.TAURI_APP;

// 2. 截取透传过来的所有参数（比如：android build, dev, ios 等）
const args = process.argv.slice(2).join(' ');

// 3. 核心路由逻辑
let command = '';
if (app) {
  // 如果指定了环境变量，说明是在跑某个具体的子应用，强制切到对应目录，用 npx 唤醒真实的 tauri-cli
  command = `cd apps/${app} && npx tauri ${args}`;
} else {
  // 如果什么环境变量都没传，直接兜底报错，防止误操作
  console.error('❌ 错误: 请不要直接运行 npm run tauri。请使用 npm run tauri:card 或 tauri:frame 等指定具体应用。');
  process.exit(1);
}

try {
  // 执行拼接好的命令，stdio: 'inherit' 可以让 Tauri 的彩色日志完美输出到终端
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  // 保证底层命令报错时，整个 node 进程也能正确返回错误码给 CI/CD
  process.exit(error.status || 1);
}