import oldBrowserWarning from "../components/oldBrowserWarning";
import { noBun, waitDOMContentLoaded } from "../utils";
noBun();
(async () => {
  await waitDOMContentLoaded();
  oldBrowserWarning.attach();
})();
