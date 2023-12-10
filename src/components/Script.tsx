import React, { FC, HTMLProps } from "react";

type OriginalScriptProps = HTMLProps<HTMLScriptElement>;
export interface ScriptProps {
  type?: string;
  content: string;
}
const Script: FC<ScriptProps> = ({ type, content }) => {
  return (
    <script type={type} dangerouslySetInnerHTML={{ __html: content }}></script>
  );
};

export default Script;
