module Helpers where

import Prelude
import Toppokki as T
import Effect.Aff (Aff)
import Node.FS.Aff (readTextFile)
import Node.Encoding (Encoding(UTF8))

setUpJS :: String -> T.Page -> Aff Unit
setUpJS script page =
    void $ T.unsafeEvaluateOnNewDocument ("document.addEventListener('DOMContentLoaded', () => {\n" <> script <> "\n});") page

setUpUserscript :: T.Page -> Aff Unit
setUpUserscript page = do
    src <- readTextFile UTF8 "../script.user.js"
    setUpJS "window.GM_info = { script: { version: '21110101-0-test' } };" page
    setUpJS src page

waitForAndClick :: String -> T.Page -> Aff Unit
waitForAndClick selector page = do
    _ <- T.pageWaitForSelector (T.Selector selector) {} page
    T.click (T.Selector selector) page

ytpaSelector :: String
ytpaSelector = ".ytpa-btn.ytpa-play-all-btn"
