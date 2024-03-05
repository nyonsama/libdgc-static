declare module "*.css" {
  const path: string;
  export default path;
}

declare module "tailwindcss/lib/cli/build" {
  export const build = async (args: any) => Promise<void>;
}

declare module "*?file" {
  const filePath: string;
  export default filePath;
}
