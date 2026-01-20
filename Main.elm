module Main exposing (main)

import Browser
import Html exposing (Html, Attribute, div, input, text)
import Html.Attributes exposing (..)
import Html.Events exposing (onInput)



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

init : () -> ( Model, Cmd Msg)
init _ =
    ({ targetWord = "apple"
    , definitions = []
    , userGuess = ""
    , status = Playing
    , message = "Type in to guess"
    }
    , Cmd.none
    )



-- UPDATE


type Msg
    = ChangeGuess String


update : Msg -> Model -> ( Model, Cmd Msg )
update message model =
    case message of
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
        [ viewInput model
        , viewStatus model
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