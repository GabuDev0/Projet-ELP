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
    { words : List String
    , targetWord : String
    , definitions : List Meaning
    , userGuess : String
    , status : Status
    , message : String
    }

type Status
    = Loading
    | Playing
    | Success
    | Error String

type alias Meaning = 
    { partOfSpeech : String
    , definitions : List String
    }

fetchWordList : Cmd Msg
fetchWordList =
    Http.get
        { url = "/static/words.json"
        , expect = Http.expectJson GotWordList wordListDecoder
        }

wordListDecoder : Decode.Decoder (List String)
wordListDecoder = 
    Decode.list Decode.string

fetchDefinitions : String -> Cmd Msg
fetchDefinitions word =
    Http.get
        { url = "https://api.dictionaryapi.dev/api/v2/entries/en/" ++ word
        , expect = Http.expectJson GotDefinitions meaningsDecoder
        }

definitionDecoder : Decode.Decoder String
definitionDecoder = Decode.field "definition" Decode.string

meaningDecoder : Decode.Decoder Meaning
meaningDecoder = 
    Decode.map2 Meaning
        (Decode.field "partOfSpeech" Decode.string)
        (Decode.field "definitions" (Decode.list definitionDecoder))

meaningsDecoder : Decode.Decoder (List Meaning)
meaningsDecoder = 
    Decode.index 0
        (Decode.field "meanings" (Decode.list meaningDecoder))


init : () -> ( Model, Cmd Msg)
init _ =
    ({ words = []
    , targetWord = ""
    , definitions = []
    , userGuess = ""
    , status = Loading
    , message = "Loading word list..."
    }
    , fetchWordList
    )



-- UPDATE


type Msg
    = ChangeGuess String
    | RefreshWord
    | NewWord String
    | GotDefinitions ( Result Http.Error ( List Meaning ) )
    | GotWordList ( Result Http.Error ( List String ) )


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
                Ok meanings ->
                    ({ model
                    | definitions = meanings
                    , status = Playing
                    , message = "Guess It!"
                    }
                    ,Cmd.none
                    )
                Err _ ->
                    ({model
                    | status = Error "Failed to fetch definitions"}
                    , Cmd.none
                    )
        GotWordList result ->
            case result of
                Ok words ->
                    case words of
                        x :: rest ->
                            ({ model
                            | words = words
                            , message = "Selecting a word..."
                            }
                            , Random.generate NewWord (Random.uniform x rest)
                            )
                        [] ->
                            ({model | status = Error "Word List Empty"}
                            , Cmd.none
                            )
                Err _ ->
                    ({model | status = Error "Failed to load word list"}
                    , Cmd.none
                    )
        RefreshWord -> 
            case model.words of
                x :: rest ->
                    ({ model
                    | definitions = []
                    , userGuess = ""
                    , status = Loading
                    , message = "New word, try again!"
                    }
                    , Random.generate NewWord (Random.uniform x rest)
                    )
                [] ->
                    (model, Cmd.none)
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
        ( List.map viewMeaning model.definitions )

viewMeaning : Meaning -> Html Msg
viewMeaning meaning = 
    div [ class "meaning" ]
        [ Html.h3 [] [ text meaning.partOfSpeech ]
        , Html.ul []
            (List.map
                (\d -> Html.li [] [ text d ])
                meaning.definitions
            )
        ]