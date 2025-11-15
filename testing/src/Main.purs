module Main where

import Toppokki as T
import Prelude (bind, discard, ($), (<>))
import Effect.Aff (Aff, delay, launchAff_)
import Data.String
import Effect (Effect)
import Data.Unit (Unit, unit)
import Effect.Console (log)
import Effect.Class (liftEffect)
import Data.Time.Duration (Milliseconds(Milliseconds))
import Node.FS.Aff (readTextFile)
import Node.Encoding (Encoding(UTF8))
import Data.Functor (void)
import Data.Maybe (Maybe, Maybe(..))
import Control.Applicative (pure)
import Data.Boolean (otherwise)
import Data.Eq ((==))
import Foreign (isNull, isUndefined, readString)
import Control.Monad.Except (runExcept)
import Data.Either (Either(..))
import Data.HeytingAlgebra ((||))

info :: String -> Aff Unit
info msg =
    liftEffect $ log msg

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

getYtpaHref :: T.Page -> Aff (Maybe String)
getYtpaHref page = do
    val <- T.unsafeEvaluateStringFunction ("document.querySelector('" <> ytpaSelector <> "')?.href") page
    if isNull val || isUndefined val then
        pure Nothing
    else
        case runExcept (readString val) of
            Left _ -> pure Nothing
            Right s -> pure (Just s)

main :: Effect Unit
main = launchAff_ do
    browser <- T.launch { headless: false } -- TODO: change it back
    page <- T.newPage browser

    T.goto (T.URL "https://youtube.com") page

    info "Waiting to reject cookies..."
    waitForAndClick "button[aria-label*=\"Reject the use of cookies\"]" page

    info "Waiting for refresh to finish..."
    T.waitForNavigation {} page
    _ <- T.pageWaitForSelector (T.Selector "[aria-label*=\"Your YouTube history is off\"]") {} page
    injectUserscript page

    info "Inputting search..."
    T.type_ (T.Selector ".ytSearchboxComponentInput") "Technology Connections" {} page
    T.click (T.Selector ".ytSearchboxComponentSearchButton") page

    info "Navigating..."
    let channelLinkSelector = ".channel-link[href=\"/@TechnologyConnections\"]"
    _ <- T.pageWaitForSelector (T.Selector channelLinkSelector) {} page
    T.click (T.Selector channelLinkSelector) page

    info "Navigating to Videos tab..."
    waitForAndClick "yt-tab-shape[tab-title=\"Videos\"]" page

    info "Waiting for YTPA..."
    _ <- T.pageWaitForSelector (T.Selector ytpaSelector) {} page

    href <- getYtpaHref page
    case href of
        Nothing -> do
            info "Failed to fetch YTPA href"
            pure unit
        Just href'
            | href' == "https://www.youtube.com/playlist?list=UULFy0tKL1T7wFoYcxCe0xjN6Q&playnext=1" -> do
                info "nice!"
                pure unit
            | otherwise -> do
                info ("fail! " <> href')
                pure unit

    info "..." -- TODO: this is just for checking
    delay (Milliseconds 10000000.0)

    T.close browser
