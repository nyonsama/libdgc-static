import { TocEntry } from "../../types";

export const Sidebar = ({ toc }: { toc?: TocEntry[] }) => {
  return (
    <aside id="sidebar" className="sidebar">
      <div className="sidebar-wrapper">
        <h2 className="pl-2 text-lg leading-12 font-medium">目录</h2>
        <hr className="mb-2 border-t border-solid border-zinc-600" />
        <ul className="mb-8">
          {toc?.map((toc) => (
            <li key={toc.id}>
              <a
                style={{
                  paddingLeft: `${(toc.level - 2 + 1) * 0.5}rem`,
                }}
                className="toc-item"
                href={"#" + encodeURIComponent(toc.id)}
              >
                {toc.content}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
