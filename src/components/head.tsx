import React, { FC, PropsWithChildren, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
interface HeadProps extends PropsWithChildren {
  title?: string;
}

const Head: FC<HeadProps> = ({ title = "libdgc.club", children } = {}) => {
  const tags = renderToStaticMarkup(
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      {children}
      <link href="/style.css" rel="stylesheet" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    </>,
  );
  const notoCss = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />`;
  const hackCss = `<link href="https://cdn.staticfile.org/hack-font/3.3.0/web/hack.min.css" rel="stylesheet" media="print" onload="this.media='all'" />`;
  return (
    <head
      dangerouslySetInnerHTML={{
        __html: `${tags}${notoCss}${hackCss}`,
      }}
    ></head>
  );
};

export default Head;
