module Run.Playground.Ui.V20260219 (main) where

import Prelude
import Toppokki as T
import Effect.Aff (Aff, attempt, delay, launchAff_)
import Command.Script (browser, setup)
import Effect (Effect)
import Command.Attempt as A
import Lib.Info (info)
import Data.Either (Either(..))
import Lib.Helpers (waitForClearScreen, ytpaSelector)
import Data.Time.Duration (Milliseconds(Milliseconds))

main :: Effect Unit
main = launchAff_ script

script :: Aff Unit
script = do
    result <- A.retry 10 attemptNewUi
    case result of
        Left err -> info err
        Right _ -> info "Running..."

attemptNewUi :: A.Attempt T.Page
attemptNewUi = do
    browser' <- browser true
    page' <- setup browser'

    waitForClearScreen page'
    T.goto (T.URL "https://www.youtube.com/@markiplier/videos") page'
    delay (Milliseconds 500.0)
    _ <- T.pageWaitForSelector (T.Selector "yt-tab-shape[tab-title=\"Videos\"]") {} page'
    delay (Milliseconds 500.0) -- no this is not unnecessary or optional

    -- TODO: the actual verification of the current state, though that seems to be comepletely unnecessary now because the UI was globally deployed so uh...

    -- DEBUG: ---

    -- brute force stop if my script works, for now, even if that is kind of silly
    -- goal is: if the button is there (it worked) -> clearly im doing something wrong because im trying to find a bug
    res <- attempt (T.pageWaitForSelector (T.Selector ytpaSelector) { timeout: 15 } page')
    case res of
        -- all of this feels so wrong, and yet its correct
        Left err -> A.succeed page'
        Right _ -> do
            T.close browser'
            A.fail "should not have worked, deal with it :^)"

    -- :GUBED ---
