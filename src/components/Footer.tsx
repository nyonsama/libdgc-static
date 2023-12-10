import IconGithub from "./IconGithub";

const Footer = () => {
  return (
    <footer className="flex justify-center bg-black">
      <div className="mx-4 flex h-12 flex-1 flex-row items-center justify-between text-gray-300 sm:max-w-2xl lg:max-w-4xl">
        <a href="/">libdgc</a>
        <IconGithub className="h-5 w-5" />
      </div>
    </footer>
  );
};

export default Footer;
