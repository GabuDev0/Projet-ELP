module Main exposing (Model)
import Html exposing (..)
import Html.Events exposing (onClick)
import Browser
import Html.Events exposing (onInput)
import Html.Attributes exposing (placeholder)


type alias Model =
    Int

initialModel : Int
initialModel =
    0


setModel : Maybe Int -> Int -> Model
setModel maybeNum model =
    case maybeNum of
        Just num -> num
        Nothing -> model


view : Model -> Html Msg
view model =
    div []
        [ text "click on those buttons"
        , button [ onClick Decrement ] [ text "-" ]
        , text (String.fromInt model)
        , button [ onClick Increment] [ text "+" ]
        , textarea [ placeholder "Write some numbers here", onInput TextInput] [ ]
        ]

type Msg = Decrement | Increment | TextInput String


main : Program () Model Msg
main =
    Browser.sandbox
        { init = initialModel
        , view = view
        , update = update
        }


update : Msg -> Model -> Model
update msg model =
    case msg of
        Increment ->
            model + 1
        Decrement ->
            model - 1
        TextInput text ->
            setModel (String.toInt text) model