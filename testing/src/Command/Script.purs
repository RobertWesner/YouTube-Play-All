module Command.Script
    ( browser
    , setup
    ) where

import Prelude
import Toppokki as T
import Lib.Helpers (setUpJS, setUpUserscript, waitForAndClickWithTimeout)
import Effect.Aff (Aff, delay)
import Lib.Info (info)
import Control.Monad.Error.Class (catchError)
import Data.Time.Duration (Milliseconds(Milliseconds))

-- | Start a new browser.
-- |
-- | First argument toggles headless mode (false=headless, true=visible).
browser :: Boolean -> Aff T.Browser
browser visible = T.launch { args: [ "--no-sandbox", "--disable-setuid-sandbox" ], headless: not visible }

setup :: T.Browser -> Aff T.Page
setup browser' = do
    page <- T.newPage browser'
    T.setViewport
        { width: 1920.0
        , height: 1080.0
        , deviceScaleFactor: 1.0
        , isMobile: false
        , hasTouch: false
        , isLandscape: true
        }
        page

    -- very cursed, yes; useful still!
    setUpJS "(()=>{const d=document.head.appendChild(Object.assign(document.createElement('script'),{id:'console-dump',type:'text/plain'}));const s=v=>{try{return JSON.stringify(v)}catch{return JSON.stringify(v,(k,val)=>typeof val==='bigint'?val.toString()+'n':typeof val==='function'?'[Function]':val)}};for(const k of Object.keys(console)){if(typeof console[k]==='function'){const o=console[k];console[k]=function(...a){try{d.textContent+=k+'('+a.map(s).join(',')+')\\n'}catch{}return o.apply(this,a)}}}})();" page

    setUpUserscript page
    T.goto (T.URL "https://youtube.com") page

    -- TODO: check if this even actually works as intended, at best this causes my pipeline to be slow due to internal hard timeouts - i could pass a proper timeout but not from here without a new waitForAndClickWithTimeout
    catchError (do
      info "Waiting to reject cookies..."
      waitForAndClickWithTimeout "button[aria-label*=\"Reject the use of cookies\"]" 15000 page
    ) (\_ -> do
      info "Skipping the wait and attempting to continue..."
      pure unit
    )

    info "Waiting for refresh to finish..."
    delay (Milliseconds 500.0)
    _ <- T.pageWaitForSelector (T.Selector "[aria-label*=\"Your YouTube history is off\"],[aria-label=\"Try searching to get started\"]") {} page
    delay (Milliseconds 1000.0)

    pure page
