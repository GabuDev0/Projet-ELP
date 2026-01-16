module Main exposing (Model)
import Html exposing (..)
import Html.Events exposing (onClick)
import Browser


type alias Model =
    Int

initialModel : Int
initialModel =
    0

view : Model -> Html Msg
view model =
    div []
        [ button [ onClick Decrement ] [ text "-" ]
        , text (String.fromInt model)
        , button [ onClick Increment] [ text "+" ]
        ]

type Msg = Decrement | Increment
main : Program () Model Msg
main =
    Browser.sandbox
        { init = initialModel
        , view = view
        , update = update
        }



update msg model =
    case msg of
        Increment ->
            model + 1
        Decrement ->
            model - 1