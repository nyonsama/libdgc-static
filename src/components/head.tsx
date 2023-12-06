import { FC } from "react";

interface HeadProps {
  title?: string;
}
const Head: FC<HeadProps> = ({ title = "libdgc-static" } = {}) => {
  return (
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link href="/github-dark.min.css" rel="stylesheet" />
      <link href="/style.css" rel="stylesheet" />
      <title>{title}</title>
    </head>
  );
};

export default Head;
