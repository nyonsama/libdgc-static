import fs from "node:fs/promises";

// 用 fs.readdir 递归遍历目录，不知道返回值能不能保证parent一定在child前面，
// 所以手动实现一个递归遍历
// 保证parent在child前面
async function* directoryIterator(dirPath: string) {
  const pathStack: string[] = await fs.readdir(dirPath);
  while (pathStack.length !== 0) {
    const sp = pathStack.pop()!;
    yield sp;
    const relativePath = `${dirPath}/${sp}`;
    const stat = await fs.stat(relativePath);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(relativePath);
      entries.reverse();
      pathStack.push(...entries.map((entry) => `${sp}/${entry}`));
    }
  }
}

export const copyModifiedFiles = async (src: string, dest: string) => {
  for await (const relativePath of directoryIterator(src)) {
    const srcPath = `${src}/${relativePath}`;
    const destPath = `${dest}/${relativePath}`;
    const destExists = await fs.exists(destPath);
    const srcStat = await fs.stat(srcPath);
    if (srcStat.isDirectory()) {
      if (!destExists) {
        await fs.mkdir(destPath);
      }
    } else if (destExists) {
      const destStat = await fs.stat(destPath);
      if (srcStat.mtimeMs >= destStat.mtimeMs) {
        await fs.copyFile(srcPath, destPath);
        console.log(`updated: ${destPath}`);
      } else {
        // console.log(`ignore: ${destPath}`);
      }
    } else {
      await fs.copyFile(srcPath, destPath);
      console.log(`new file: ${destPath}`);
    }
  }
};
