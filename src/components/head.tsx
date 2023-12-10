import { FC, PropsWithChildren } from "react";

interface HeadProps extends PropsWithChildren {
  title?: string;
}

const Head: FC<HeadProps> = ({ title = "libdgc.club", children } = {}) => {
  return (
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      {children}
      <link href="/style.css" rel="stylesheet" />
      <title>{title}</title>
    </head>
  );
};

export default Head;
