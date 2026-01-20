module Main exposing (main)

import Browser
import Html exposing (Html, div, input, text)
import Html.Attributes exposing (..)
import Html.Events exposing (onInput, onClick)
import Http
import Json.Decode as D



-- MAIN


main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }



-- MODEL


type alias Model =
    { targetWord : String
    , definition : String
    , userGuess : String
    , status : Status
    , message : String
    }


type Status
    = Loading
    | Playing
    | Success
    | Error String



-- INIT


init : () -> ( Model, Cmd Msg )
init _ =
    ( { targetWord = "apple"
      , definition = ""
      , userGuess = ""
      , status = Loading
      , message = "Loading definition..."
      }
    , getDefinition "apple"
    )



-- HTTP


getDefinition : String -> Cmd Msg
getDefinition word =
    Http.get
        { url = "https://api.dictionaryapi.dev/api/v2/entries/en/" ++ word
        , expect = Http.expectJson GotDefinition definitionDecoder
        }


definitionDecoder : D.Decoder String
definitionDecoder =
    D.at
        [ "0"
        , "meanings"
        , "0"
        , "definitions"
        , "0"
        , "definition"
        ]
        D.string



-- UPDATE


type Msg
    = ChangeGuess String
    | GotDefinition (Result Http.Error String)
    | RefreshWord

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ChangeGuess newGuess ->
            if model.status == Success then
                ( model, Cmd.none )

            else if newGuess == model.targetWord then
                ( { model
                    | userGuess = newGuess
                    , status = Success
                    , message =
                        "Got it! It is indeed "
                            ++ model.targetWord
                            ++ "!"
                  }
                , Cmd.none
                )

            else
                ( { model
                    | userGuess = newGuess
                    , status = Playing
                    , message = "Keep trying..."
                  }
                , Cmd.none
                )

        GotDefinition result ->
            case result of
                Ok def ->
                    ( { model
                        | definition = def
                        , status = Playing
                        , message = "Type in to guess"
                      }
                    , Cmd.none
                    )

                Err _ ->
                    ( { model
                        | status = Error "Failed to load definition"
                      }
                    , Cmd.none
                    )
        
        RefreshWord -> 
            ({ targetWord = "banana"
            , definition = ""
            , userGuess = ""
            , status = Playing
            , message = "New word, try again!"
            }
            , getDefinition "banana"
            )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- VIEW


view : Model -> Html Msg
view model =
    div []
        [ viewDefinition model
        , viewInput model
        , viewStatus model
        , viewRefreshButton
        ]


viewDefinition : Model -> Html Msg
viewDefinition model =
    case model.status of
        Loading ->
            text ""

        Error _ ->
            text ""

        _ ->
            div []
                [ text ("Definition: " ++ model.definition) ]


viewInput : Model -> Html Msg
viewInput model =
    input
        [ placeholder "Type in to guess"
        , value model.userGuess
        , onInput ChangeGuess
        , disabled (model.status /= Playing)
        ]
        []


viewStatus : Model -> Html Msg
viewStatus model =
    case model.status of
        Playing ->
            div [] [ text model.message ]

        Success ->
            div [] [ text ("Congratulations! " ++ model.message) ]

        Loading ->
            div [] [ text "Loading..." ]

        Error err ->
            div [] [ text ("Error: " ++ err) ]

viewRefreshButton : Html Msg
viewRefreshButton = 
    div []
    [ Html.button [onClick RefreshWord] [text "Go for a new word" ] ]