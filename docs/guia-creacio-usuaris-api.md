# Guia de creacio de voluntaris i aprenents per API

Aquest document explica com crear nous usuaris amb rol `voluntari` o `aprenent` utilitzant l API del backend del projecte.

## Objectiu

La creacio d usuaris es fa a traves de la ruta d administracio d usuaris. Aquesta ruta crea:

- el registre base a la taula `users`
- el registre relacionat a `voluntaris` o `aprenents`, segons el rol enviat

## Requisits previs

Abans de fer la peticio cal:

- tenir el backend en marxa
- tenir un usuari administrador valid
- iniciar sessio com a administrador per obtenir un token

## Ruta que s ha d utilitzar

```text
POST /api/users
```

## Autenticacio necessaria

Aquesta ruta nomes permet l acces a usuaris amb rol `admin`.

Cal enviar la capcalera:

```text
Authorization: Bearer <token_admin>
```

També cal enviar:

```text
Content-Type: application/json
```

## Flux recomanat

1. Fer login amb un compte administrador.
2. Guardar el token retornat per `/api/auth/login`.
3. Enviar la peticio `POST /api/users` amb aquest token.
4. Posar el camp `rol` amb valor `voluntari` o `aprenent`.

## Exemple de login d administrador

```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"
```

La resposta retorna un objecte similar a aquest:

```json
{
  "message": "Inici de sessio correcte.",
  "token": "TOKEN_ADMIN",
  "expiresAt": 1776540000000,
  "redirectTo": "/frontend/pages/admin.html",
  "user": {
    "id": 1,
    "nom": "Admin",
    "cognoms": "Principal",
    "email": "admin@example.com",
    "rol": "admin"
  }
}
```

El valor de `token` es el que s ha d utilitzar a la seguent peticio.

## Camps obligatoris

Per crear un usuari, el backend espera com a minim aquests camps:

```json
{
  "nom": "Laura",
  "cognoms": "Serra",
  "email": "laura@example.com",
  "password": "laura123",
  "rol": "voluntari"
}
```

## Camps opcionals de perfil

Es poden afegir també camps propis del perfil:

```json
{
  "telefon": "600111222",
  "parroquia": "Sant Pere",
  "data_naixement": "1998-04-10",
  "disponibilitat": "Dimarts i dijous",
  "observacions": "Cap"
}
```

## Exemple complet per crear un voluntari

```bash
curl -X POST http://localhost:3000/api/users ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_ADMIN" ^
  -d "{
    \"nom\": \"Laura\",
    \"cognoms\": \"Serra\",
    \"email\": \"laura@example.com\",
    \"password\": \"laura123\",
    \"rol\": \"voluntari\",
    \"telefon\": \"600111222\",
    \"parroquia\": \"Sant Pere\",
    \"data_naixement\": \"1998-04-10\",
    \"disponibilitat\": \"Dimarts i dijous\",
    \"observacions\": \"Cap\"
  }"
```

## Exemple complet per crear un aprenent

```bash
curl -X POST http://localhost:3000/api/users ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TOKEN_ADMIN" ^
  -d "{
    \"nom\": \"Marc\",
    \"cognoms\": \"Costa\",
    \"email\": \"marc@example.com\",
    \"password\": \"marc123\",
    \"rol\": \"aprenent\",
    \"telefon\": \"600333444\",
    \"parroquia\": \"Santa Maria\",
    \"data_naixement\": \"2000-09-21\",
    \"disponibilitat\": \"Dilluns i dimecres\",
    \"observacions\": \"Cap\"
  }"
```

## Exemple equivalent en JSON

### Voluntari

```json
{
  "nom": "Laura",
  "cognoms": "Serra",
  "email": "laura@example.com",
  "password": "laura123",
  "rol": "voluntari",
  "telefon": "600111222",
  "parroquia": "Sant Pere",
  "data_naixement": "1998-04-10",
  "disponibilitat": "Dimarts i dijous",
  "observacions": "Cap"
}
```

### Aprenent

```json
{
  "nom": "Marc",
  "cognoms": "Costa",
  "email": "marc@example.com",
  "password": "marc123",
  "rol": "aprenent",
  "telefon": "600333444",
  "parroquia": "Santa Maria",
  "data_naixement": "2000-09-21",
  "disponibilitat": "Dilluns i dimecres",
  "observacions": "Cap"
}
```

## Resposta esperada

Si la creacio va be, el backend retorna `201 Created` amb una resposta d aquest estil:

```json
{
  "message": "Usuari creat correctament.",
  "data": {
    "id": 8,
    "nom": "Laura",
    "cognoms": "Serra",
    "email": "laura@example.com",
    "rol": "voluntari",
    "telefon": "600111222",
    "parroquia": "Sant Pere",
    "data_naixement": "1998-04-10",
    "disponibilitat": "Dimarts i dijous",
    "observacions": "Cap"
  }
}
```

## Errors habituals

### 401 Unauthorized

Vol dir que no s ha enviat token o que el token no es valid.

### 403 Forbidden

Vol dir que l usuari autenticat no te rol `admin`.

### 409 Conflict

Vol dir que ja existeix un usuari amb el mateix correu electronic.

### 400 Bad Request

Vol dir que falta algun camp obligatori o que el rol indicat no es valid.

## Validacions importants

- `rol` nomes pot ser `admin`, `voluntari` o `aprenent`
- per aquest cas s han d utilitzar `voluntari` o `aprenent`
- `email` ha de ser unic
- `nom`, `cognoms`, `email`, `password` i `rol` son obligatoris en la creacio

## Nota important sobre el registre public

La ruta actual no es una ruta publica de registre. Esta pensada per a gestio interna i requereix permisos d administrador.

Si en algun moment es vol permetre que un usuari es registri directament des del frontend sense ser administrador, caldra crear una ruta nova, per exemple:

```text
POST /api/auth/register
```

o be:

```text
POST /api/public/register
```

Amb la implementacio actual, la creacio de voluntaris i aprenents s ha de fer des d un compte administrador o des d una eina interna que utilitzi el token d administrador.
