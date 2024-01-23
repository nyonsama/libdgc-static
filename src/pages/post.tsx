import { FC } from "react";
import { Post } from "../types";
import Head from "../components/Head";
import IconToc from "../components/IconToc";
import Footer from "../components/Footer";
import Link from "../components/Link";
import Script from "../components/Script";
import IconCalendar from "../components/IconCalendar";

const clientCode = () => {
  const $ = document.querySelector.bind(document);

  const sidebar = {
    element: $("#sidebar") as HTMLDivElement,
    show: false,
    toggle() {
      this.show = !this.show;
      if (this.show) {
        this.element.classList.remove("max-lg:translate-x-full");
      } else {
        this.element.classList.add("max-lg:translate-x-full");
      }
    },
  };

  class Navbar {
    element: HTMLElement;
    state = "show" as "show" | "hide";
    constructor(element: HTMLElement) {
      this.element = element;
    }
    toggle() {
      switch (this.state) {
        case "hide":
          this.element.style.transform = "";
          this.state = "show";
          break;
        case "show":
          this.element.style.transform = "translateY(-100%)";
          this.state = "hide";
          break;
        default:
          break;
      }
    }
  }
  const navbar = new Navbar(document.getElementById("navbar")!);

  class Backdrop {
    element: HTMLElement;
    state = "hidden" as "hidden" | "appearing" | "show" | "fading";
    showClasses = ["opacity-50"];
    fadingClasses = ["opacity-0"];
    hiddenClasses = ["opacity-0", "-z-10"];
    currentClasses = ["opacity-0", "-z-10"];
    constructor(element: HTMLElement) {
      this.element = element;
      element.addEventListener(
        "transitionend",
        this.onTransitionEnd.bind(this),
      );
    }
    setClasses(classes: string[]) {
      this.element.classList.remove(...this.currentClasses);
      this.element.classList.add(...classes);
      this.currentClasses = classes;
    }
    show(zIndex: number = 10) {
      const { element, state } = this;
      switch (state) {
        case "hidden":
        case "fading":
          this.state = "appearing";
          this.setClasses(this.showClasses);
          element.style.zIndex = `${zIndex}`;
        default:
          break;
      }
    }
    hide() {
      switch (this.state) {
        case "appearing":
        case "show":
          this.state = "fading";
          this.setClasses(this.fadingClasses);
          break;

        default:
          break;
      }
    }
    toggle(zIndex?: number) {
      switch (this.state) {
        case "appearing":
        case "show":
          this.hide();
          break;
        case "hidden":
        case "fading":
          this.show(zIndex);
          break;
      }
    }
    onTransitionEnd() {
      switch (this.state) {
        case "appearing":
          this.state = "show";
          break;
        case "fading":
          this.setClasses(this.hiddenClasses);
          this.element.style.zIndex = "";
          this.state = "hidden";
          break;
      }
    }
  }

  const backdrop = new Backdrop(document.querySelector("#backdrop")!);

  const tocButton = $("#button-show-toc") as HTMLDivElement;
  tocButton.addEventListener("click", () => {
    backdrop.toggle(30);
    sidebar.toggle();
  });

  backdrop.element.addEventListener("click", () => {
    if (sidebar.show) {
      sidebar.toggle();
      backdrop.toggle();
    } else if (preview.isShow()) {
      preview.close();
    }
  });

  const html = document.documentElement;
  const disableScroll = () => {
    document.body.classList.add("overflow-hidden");
  };
  const enableScroll = () => {
    document.body.classList.remove("overflow-hidden");
  };
  const preview = {
    state: "hidden" as "hidden" | "appearing" | "show" | "fading",
    element: null as HTMLImageElement | null,
    isShow() {
      return !!this.element;
    },
    onTransitionRun() {},
    onTransitionEnd() {
      switch (this.state) {
        case "fading":
          this.state = "hidden";
          this.element!.style.zIndex = "";
          break;
        case "appearing":
          this.state = "show";
        default:
          break;
      }
    },
    onTransitionCancel() {},
    toggle(element?: HTMLImageElement) {
      if (element && (this.state === "hidden" || this.state === "fading")) {
        this.show(element);
      } else if (this.state === "show" || this.state === "appearing") {
        this.close();
      }
    },
    close() {
      if (this.state === "fading" || this.state === "hidden") {
        return;
      }
      const { element } = this;
      element!.setAttribute("style", `z-index:20;`);
      navbar.toggle();
      backdrop.toggle();
      enableScroll();
      element!.setAttribute("title", "点击预览");
      this.state = "fading";
    },
    show(element: HTMLImageElement) {
      if (this.state === "appearing" || this.state === "show") {
        return;
      }
      this.element = element;

      const htmlWidth = html.clientWidth;
      const htmlHeight = html.clientHeight;
      const { x, y, width, height, right } = element.getBoundingClientRect();
      const scaleX = htmlWidth / width;
      const scaleY = htmlHeight / height;
      const scale = `scale(${Math.min(scaleX, scaleY, 4)})`;
      const translateX = `translateX(${-x + htmlWidth / 2 - width / 2}px)`;
      const translateY = `translateY(${-y + htmlHeight / 2 - height / 2}px)`;
      const transform = `transform:${translateX} ${translateY} ${scale};`;
      element.setAttribute("style", `${transform};z-index:20;`);

      disableScroll();
      navbar.toggle();
      backdrop.toggle();
      element.setAttribute("title", "点击取消预览");
      this.state = "appearing";
    },
  };

  const postImages = document.querySelectorAll(".post img");
  for (let index = 0; index < postImages.length; index++) {
    const element = postImages[index] as HTMLImageElement;
    element.setAttribute("title", "点击预览");
    element.addEventListener("click", (e) => {
      preview.toggle(element);
    });
    element.addEventListener(
      "transitionend",
      preview.onTransitionEnd.bind(preview),
    );
  }
};
export interface PostPageProps {
  post: Post;
}
export const PostPage: FC<PostPageProps> = ({ post }: PostPageProps) => {
  return (
    <html lang="zh">
      <Head title={post.metadata.title}>
        <link href="/github-dark.min.css" rel="stylesheet" />
      </Head>
      <body>
        <div className="flex min-h-full flex-col ">
          {/* navbar */}
          <nav
            id="navbar"
            className="sticky top-0 z-30 flex justify-center bg-black transition-transform"
          >
            <div className="mx-4 flex h-12 flex-1 flex-row items-center justify-between sm:max-w-2xl lg:max-w-4xl">
              <a href="/">libdgc</a>
              <IconToc
                id="button-show-toc"
                className="h-6 w-6 cursor-pointer lg:hidden"
              />
            </div>
          </nav>
          <div className="flex flex-1 flex-col items-center px-4 py-8">
            <div className="flex w-full flex-row-reverse justify-between sm:max-w-2xl lg:max-w-4xl">
              {/* sidebar */}
              <aside
                id="sidebar"
                className="w-48 transition-transform max-lg:fixed max-lg:bottom-0 max-lg:right-0 max-lg:top-0 max-lg:z-40 max-lg:w-56 max-lg:translate-x-full max-lg:bg-zinc-900 max-lg:p-4 max-lg:pt-0 lg:ml-8"
              >
                <div className="overflow-y-auto lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem-6rem)]">
                  <h2 className="text-lg font-medium leading-[3rem]">目录</h2>
                  <hr className="mb-2 border-t border-solid border-gray-600" />
                  <ul>
                    {post.metadata.toc?.map((toc) => (
                      <li
                        key={toc.id}
                        style={{ marginLeft: `${(toc.level - 2) * 0.5}rem` }}
                        className="mb-2"
                      >
                        <a
                          className={`text-sm text-gray-400 underline-offset-2 hover:underline`}
                          href={"#" + encodeURIComponent(toc.id)}
                        >
                          {toc.content}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
              {/* post body */}
              <main className="prose prose-invert max-w-full flex-1 prose-headings:text-gray-300 prose-a:text-[#74b0e4] prose-a:no-underline prose-a:underline-offset-2">
                {/* title */}
                <h1>{post.metadata.title}</h1>
                <div className="not-prose flex">
                  <div className="mr-4">
                    <IconCalendar className="mr-2 inline-block h-full w-[18px] align-top" />
                    {post.metadata.createDate}
                  </div>
                  {/* tags */}
                  <div className="not-prose flex gap-2 text-gray-400">
                    {post.metadata.tags?.map((tag, i) => (
                      <div key={i}>#{tag}</div>
                    ))}
                  </div>
                </div>
                {/* content */}
                <div
                  className="post"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                ></div>
              </main>
            </div>
          </div>
          <Footer className="sm:max-w-2xl lg:max-w-4xl" />
          <div
            id="backdrop"
            className="fixed inset-0 -z-10 bg-black opacity-0 transition-opacity"
          ></div>
        </div>
        <Script content={`(${clientCode})()`} />
        <Script
          type="speculationrules"
          content={JSON.stringify({
            prefetch: [
              {
                source: "list",
                urls: ["/index.html"],
              },
            ],
          })}
        />
      </body>
    </html>
  );
};
