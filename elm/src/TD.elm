module TD exposing (..)
import Html exposing (a)


addElemList elem n lst = 
    if n == 0 then
        lst
    else
        addElemList elem (n-1) (elem :: lst)

dupli lst = case lst of 
    [] -> lst
    (x::xs) -> x :: x :: dupli xs



comp lst = case lst of
    [] -> lst
    (x::xs) ->
        case xs of
            [] -> lst
            (y::ys) ->
                if y == x then
                    comp xs
                else
                    comp xs



type ValeurCarte = ValeurCarte Int

valeurCarte : Int -> Maybe ValeurCarte
valeurCarte v =
    if 1 <= v && v <= 13 then
        Just(ValeurCarte v)
    else
        Nothing


type CouleurCarte = Trèfle | Pique | Coeur | Carreau


type Carte = Carte CouleurCarte ValeurCarte

carte couleurCarte_ valeurCarte_ =
    case valeurCarte valeurCarte_ of
        Just v -> Carte couleurCarte_ v
        Nothing -> Carte couleurCarte_ (ValeurCarte 1)


type Tree = Tree Float (Maybe Tree) (Maybe Tree)

arbre_vide = Just(Tree 2 Nothing Nothing)

arbre_1 = Just(Tree 1.5 (Just(Tree 1 Nothing Nothing)) (Just(Tree 3 Nothing Nothing)))

max: number -> number -> number
max a b =
    if a > b then
        a
    else
        b

len_arbre : Maybe(Tree) -> number
len_arbre a =
    case a of
        Nothing -> 0
        Just(Tree v a_d a_g) -> 1 + (len_arbre a_d) + (len_arbre a_g)


hauteur_arbre : Maybe(Tree) -> number
hauteur_arbre a =
    case a of
        Nothing -> 0
        Just(Tree v a_d a_g) -> 1 + max (hauteur_arbre a_d) (hauteur_arbre a_g)