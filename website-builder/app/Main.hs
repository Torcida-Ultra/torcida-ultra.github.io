--------------------------------------------------------------------------------
{-# LANGUAGE OverloadedStrings #-}

import Data.Monoid (mappend)
import Hakyll
import Main.Utf8
import Text.Pandoc.Highlighting (Style, breezeDark, styleToCss)
import Text.Pandoc.Options (ReaderOptions (..), WriterOptions (..))

--------------------------------------------------------------------------------
pandocCompilerSyntaxHighlight :: Compiler (Item String)
pandocCompilerSyntaxHighlight =
    pandocCompilerWith
        defaultHakyllReaderOptions
        defaultHakyllWriterOptions
            { writerHighlightStyle = Just pandocCodeStyle
            }

pandocCodeStyle :: Style
pandocCodeStyle = breezeDark

main :: IO ()
main = withUtf8 $ hakyllWith (defaultConfiguration{destinationDirectory = "docs"}) $ do
    match "CNAME" $ do
        route idRoute
        compile copyFileCompiler

    match "images/*" $ do
        route idRoute
        compile copyFileCompiler

    match "css/*" $ do
        route idRoute
        compile compressCssCompiler

    match "js/*" $ do
        route idRoute
        compile copyFileCompiler

    -- match (fromList ["pages/about.markdown"]) $ do
    --     route $ setExtension "html"
    --     compile $
    --         pandocCompiler
    --             >>= loadAndApplyTemplate "templates/default.html" defaultContext
    --             >>= relativizeUrls

    match "pages/about.html" $ do
        route $ idRoute
        compile $
            pandocCompiler
                >>= loadAndApplyTemplate "templates/default.html" defaultContext
                >>= relativizeUrls

    create ["css/syntax.css"] $ do
        route idRoute
        compile $ do
            makeItem $ styleToCss pandocCodeStyle

    match "index.html" $ do
        route idRoute
        compile $ do
            let indexCtx = defaultContext

            getResourceBody
                >>= applyAsTemplate indexCtx
                >>= loadAndApplyTemplate "templates/default.html" indexCtx
                >>= relativizeUrls

    match "templates/*" $ compile templateBodyCompiler

--------------------------------------------------------------------------------
postCtx :: Context String
postCtx =
    dateField "date" "%B %e, %Y"
        `mappend` defaultContext
