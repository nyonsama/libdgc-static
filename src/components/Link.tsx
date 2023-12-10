import classNames from "classnames";
import { FC, HTMLProps } from "react";

const Link: FC<HTMLProps<HTMLAnchorElement>> = (props) => {
  return (
    <a
      {...props}
      className={classNames(
        "text-[#74b0e4] underline-offset-2 hover:underline",
        props.className,
      )}
    ></a>
  );
};

export default Link;
