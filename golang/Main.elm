module Main exposing (main)

import Browser
import Http
import Random
import Json.Decode as Decode
import Html exposing (Html, Attribute, div, input, text)
import Html.Attributes exposing (..)
import Html.Events exposing (onInput, onClick)



-- MAIN


main =
    Browser.element { init = init, update = update, view = view, subscriptions = subscriptions }



-- MODEL


type alias Model =
    { targetWord : String
    , definitions : List String
    , userGuess : String
    , status : Status
    , message : String
    }

type Status
    = Loading
    | Playing
    | Success
    | Error String

words =
    [ "banana", "cat", "dog", "music" ]


fetchDefinitions : String -> Cmd Msg
fetchDefinitions word =
    Http.get
        { url = "https://api.dictionaryapi.dev/api/v2/entries/en/" ++ word
        , expect = Http.expectJson GotDefinitions definitionsDecoder
        }

definitionsDecoder : Decode.Decoder (List String)
definitionsDecoder = 
    Decode.at
        ["0", "meanings", "0", "definitions"]
        (Decode.list (Decode.field "definition" Decode.string))

randomWord : Random.Generator String
randomWord = 
    Random.uniform "apple" words

init : () -> ( Model, Cmd Msg)
init _ =
    ({ targetWord = ""
    , definitions = []
    , userGuess = ""
    , status = Loading
    , message = "Loading definitions..."
    }
    , Random.generate NewWord randomWord
    )



-- UPDATE


type Msg
    = ChangeGuess String
    | RefreshWord
    | NewWord String
    | GotDefinitions ( Result Http.Error ( List String ) )


update : Msg -> Model -> ( Model, Cmd Msg )
update message model =
    case message of
        NewWord word ->
            ({ model
            | targetWord = word
            , userGuess = ""
            , status = Loading
            , message = "Loading definitions..."
            }
            , fetchDefinitions word
            )
        GotDefinitions result ->
            case result of 
                Ok defs ->
                    ({ model
                    | definitions = defs
                    , status = Playing
                    }
                    ,Cmd.none
                    )
                Err _ ->
                    ({model
                    | status = Error "Failed to fetch definitions"}
                    , Cmd.none
                    )
        RefreshWord -> 
            ({ model
            | definitions = []
            , userGuess = ""
            , status = Loading
            , message = "New word, try again!"
            }
            , Random.generate NewWord randomWord
            )
        ChangeGuess newGuess ->
            if model.status == Success then
                ( model , Cmd.none )
            else if newGuess == model.targetWord then
                ( { model 
                | userGuess = newGuess
                , status = Success
                , message = "Got it! It is indeed " ++ model.targetWord ++ "!"
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

subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- VIEW

view : Model -> Html Msg
view model = 
    div []
        [ viewDefinitions model
        , viewInput model
        , viewStatus model
        , viewRefreshButton
        ]

viewInput : Model -> Html Msg
viewInput model =
    input [ placeholder "Type in to guess", value model.userGuess, onInput ChangeGuess, disabled ( model.status == Success ) ] []

viewStatus : Model -> Html Msg
viewStatus model =
    case model.status of
        Playing ->
            div [] [ text model.message ]

        Success ->
            div []
                [ text ("Congratulations!" ++ model.message) ]

        Loading ->
            div [] [ text "Loading..." ]

        Error err ->
            div [] [ text ("Error: " ++ err) ]

viewRefreshButton : Html Msg
viewRefreshButton = 
    div []
    [ Html.button [onClick RefreshWord] [text "Go for a new word" ] ]

viewDefinitions : Model -> Html Msg
viewDefinitions model =
    div[]
        ( List.map (\d -> div [] [ text d ]) model.definitions )