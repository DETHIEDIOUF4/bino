# bino — guide de marque (v7, framboise)

## L'idée

Le mot **est** la voiture. Le ventre du **b** et le **o** sont les deux roues, moyeu compris ; le toit se pose au-dessus du **i** et du **n**, avec **deux passagers** à l'intérieur — un jaune, un corail. Le mot roule sur une route en pointillé.

C'est ce qui rend la marque difficile à oublier : on ne lit pas « un logo + un mot », on lit un seul objet qui dit covoiturage. La **pousse** jaune sur la hampe du b porte le développement durable.

La pousse et la route sont vertes : c'est le seul vert de la marque, et il porte à lui seul le message durable au milieu d'une palette chaude.

Le point du i a disparu : le toit et les passagers occupent cette place. C'est voulu — ne pas le remettre.

Pour l'icône d'application, le mot ne tient pas dans un carré : c'est la voiture complète, vue de profil, qui sert de symbole (`bino-icone-app.svg`, `bino-symbole-voiture.svg`).

## Fichiers

| Fichier | Usage |
|---|---|
| `bino-logo-principal.svg` | Logo par défaut : le mot-voiture sur sa route |
| `bino-logo-compact.svg` | Sans la route : en-tête d'application, petites tailles, signature de courriel |
| `bino-icone-app.svg` | Icône d'application (App Store, Play Store, favicon) |
| `bino-symbole-voiture.svg` | La voiture seule, fond clair : épingle de carte, illustrations, autocollants |
| `bino-symbole-blanc.svg` | La voiture seule en blanc, fond foncé ou photo |
| `bino-logo-blanc.svg` | Le mot en blanc, fonds foncés et photos |
| `bino-logo-monochrome.svg` | Une seule couleur (framboise `#D62B4C`) : sérigraphie, tampon, broderie |
| `png/` | Exports PNG à fond transparent (1024, 512, 192 px pour l'icône ; 2000 px de large pour les logos) |

Le SVG est le format à donner au développeur : vectoriel, redimensionnable à l'infini, quelques kilo-octets. **Aucune police n'est requise** — les lettres sont dessinées en tracés, donc rien ne casse sur un serveur ou un téléphone qui n'a pas la fonte.

## Couleurs

| Nom | Hex | Rôle |
|---|---|---|
| Framboise | `#FF4D6D` | Couleur de marque : lettrage, carrosserie |
| Rose clair | `#FF6B8A` | Haut du dégradé de l'icône |
| Abricot | `#FFA53D` | Bas du dégradé de l'icône |
| Framboise profond | `#9E1436` | Pare-brise et moyeux du symbole |
| Menthe d'eau | `#00D6A3` | Pousse, route, passager de droite, réussites et confirmations |
| Jaune soleil | `#FFC400` | Passager de gauche, badges, mises en avant |
| Framboise bouton | `#D62B4C` | Boutons, liens, texte de marque. Le framboise vif ne passe pas les contrastes en petit corps |
| Encre | `#2B0F18` | Texte de l'interface |
| Crème | `#FFF6F2` | Fond alternatif au blanc, réchauffe la palette |

Deux précautions parce que la marque est dans la famille des rouges :

- **Les alertes ont besoin d'une couleur à elles.** Un rouge d'erreur voisin du framboise rendrait les annulations de trajet indistinctes des boutons de marque. Utiliser un rouge nettement plus sombre et moins rose, du type `#A3001B`, réservé aux erreurs — et faire porter le message par une icône et un texte, pas seulement par la couleur.
- **La confirmation passe par la menthe d'eau `#00D6A3`**, jamais par un vert improvisé. C'est déjà la couleur du deuxième passager, donc elle appartient à la marque.

## Règles d'usage

- **Zone de protection** : garder autour du logo un espace vide égal à la hauteur du « o ». Rien n'entre dedans.
- **Taille minimale** : 140 px de large pour le logo avec sa route, 100 px pour la version compacte, 24 px pour l'icône. Sous 100 px, les passagers deviennent deux points de couleur — encore lisible, mais ne pas descendre plus bas.
- **À éviter** : remettre un point sur le i, retirer le toit ou les moyeux des roues, ajouter un troisième passager, étirer, incliner, ajouter une ombre portée ou un contour, poser le logo couleur sur un fond vert ou sur une photo chargée (utiliser la version blanche).
- Sur fond foncé ou photo, toujours `bino-logo-blanc.svg`.

## Typographie d'accompagnement

Le logo n'utilise pas de police, mais l'interface en a besoin. Une géométrique ronde s'accorde au lettrage : **Outfit** ou **Poppins** (Google Fonts, gratuites, licence ouverte) pour les titres, la même famille en graisse Regular pour le texte courant. Une seule famille suffit ; ça allège aussi le poids de l'application.

## À faire avant de déposer la marque

Vérifier l'antériorité auprès de l'OPIC (classe 39 – transport), le Registraire des entreprises du Québec, la disponibilité de bino.ca et du nom dans les magasins d'applications.

## Palettes à l'essai

Choix arrêté : **Framboise**. Les fichiers de la racine sont les bons.

Le dossier `palettes/` garde les cinq pistes explorées — menthe, mandarine, bleuet, mauve, framboise — avec la planche de comparaison `bino-palettes-comparaison.png`. Les fichiers de ce dossier sont des esquisses de couleur, pas des livrables : ne pas les envoyer au développeur.

À vérifier une fois l'application maquettée : le rendu du framboise en petites épingles sur un fond de carte, et la cohabitation avec le rouge et or de l'Université Laval sur un document où les deux logos se côtoient.
