module Helpers where

import Prelude
import Toppokki as T
import Effect.Aff (Aff)
import Node.FS.Aff (readTextFile)
import Node.Encoding (Encoding(UTF8))

injectScript :: String -> T.Page -> Aff Unit
injectScript script page =
    void $ T.unsafeEvaluateStringFunction script page

injectUserscript :: T.Page -> Aff Unit
injectUserscript page = do
    src <- readTextFile UTF8 "../script.user.js"
    injectScript "window.GM_info = { script: { version: '21110101-0-test' } };" page
    injectScript src page

waitForAndClick :: String -> T.Page -> Aff Unit
waitForAndClick selector page = do
    _ <- T.pageWaitForSelector (T.Selector selector) {} page
    T.click (T.Selector selector) page

ytpaSelector :: String
ytpaSelector = ".ytpa-btn.ytpa-play-all-btn"
