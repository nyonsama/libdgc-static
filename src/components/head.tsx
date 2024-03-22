import React, { FC, PropsWithChildren, createElement, useContext } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RenderContext } from "../contexts/renderContext";
interface HeadProps extends PropsWithChildren {
  title?: string;
}

const Head: FC<HeadProps> = ({ title = "libdgc.club", children } = {}) => {
  const { assetPaths } = useContext(RenderContext);
  const { css, js } = assetPaths;
  const tags = renderToStaticMarkup(
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#000000" />
      <title>{title}</title>
      {children}
      {css.map((path, index) => (
        <link href={path} key={index} rel="stylesheet" />
      ))}
      {js.map((path, index) => (
        <script async src={path} key={index} type="module"></script>
      ))}
      {/* <link rel="preconnect" href="https://fonts.googleapis.com" /> */}
      {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /> */}
    </>,
  );
  // const notoCss = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300..900&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />`;
  return (
    <head
      dangerouslySetInnerHTML={{
        __html: `${tags}`,
        // __html: `${tags}${notoCss}`,
      }}
    ></head>
  );
};

export default Head;
