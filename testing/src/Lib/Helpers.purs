module Lib.Helpers where

import Prelude
import Toppokki as T
import Effect.Aff (Aff, delay)
import Node.FS.Aff (readTextFile)
import Node.Encoding (Encoding(UTF8))
import Data.Time.Duration (Milliseconds(Milliseconds))

timeout :: Int
timeout = 1000 * 60 * 10 -- 10min, just so the pipeline doesnt randomly die, because I spent hours debugging locally and could not find any issues

setUpJS :: String -> T.Page -> Aff Unit
setUpJS script page =
    void $ T.unsafeEvaluateOnNewDocument ("document.addEventListener('DOMContentLoaded', () => {\n" <> script <> "\n});") page

setUpUserscript :: T.Page -> Aff Unit
setUpUserscript page = do
    src <- readTextFile UTF8 "../script.user.js"
    -- TODO: possibly look for a more reliable fix
    setUpJS "if (window.hasOwnProperty('trustedTypes') && !window.trustedTypes.defaultPolicy) {window.trustedTypes.createPolicy('default', { createHTML: string => string, createScript: s => s, createScriptURL: s => s, });}" page
    setUpJS "window.unsafeWindow = window" page
    setUpJS "window.GM = { info: { script: { version: '21110101-0-test' } }, getValue: () => ({}) };" page
    setUpJS src page

waitForAndClick :: String -> T.Page -> Aff Unit
waitForAndClick selector page = do
    _ <- T.pageWaitForSelector (T.Selector selector) { timeout: timeout } page
    T.click (T.Selector selector) page

waitForClearScreen :: T.Page -> Aff Unit
waitForClearScreen page = do
    _ <- T.unsafeEvaluateStringFunction ("document.head.remove();const lock=document.createElement('div');lock.id='lock';lock.textContent='Waiting';document.body.textContent='';document.body.append(lock);") page
    delay (Milliseconds 500.0)
    _ <- T.pageWaitForSelector (T.Selector "#lock") { timeout: timeout } page
    delay (Milliseconds 500.0)

ytpaSelector :: String
ytpaSelector = ".ytpa-btn.ytpa-play-all-btn"

simpleVideosTabTypeSelector :: Int -> String
simpleVideosTabTypeSelector n = let s = show n in "#primary #chips yt-chip-cloud-chip-renderer:nth-child(" <> s <> ")," <> ".ytChipBarViewModelChipWrapper:nth-child(" <> s <> ")"
