import classNames from "classnames";
import IconGithub from "./IconGithub";
import { FC } from "react";

export interface FooterProps {
  className?: string;
}
const Footer: FC<FooterProps> = ({ className }) => {
  return (
    <footer className="flex justify-center bg-black">
      <div
        className={classNames(
          "mx-4 flex h-12 flex-1 flex-row items-center justify-between",
          className,
        )}
      >
        <div className="text-zinc-300">Keep it simple and stupid.</div>
        <a href="https://github.com/nyonsama/libdgc-static" target="_blank">
          <IconGithub className="h-5 w-5" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
