import { FC, PropsWithChildren } from "react";
interface HeadProps extends PropsWithChildren {
  title?: string;
}

const Head: FC<HeadProps> = ({ title = "libdgc.club", children } = {}) => {
  return (
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#000000" />
      <title>{title}</title>
      {children}
      <link href="/src/style.css" rel="stylesheet" />
    </head>
  );
};

export default Head;
