

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
# Regista API

It's a personal project that collects football data from publicly available sources, it's currently only supporting some endpoints from Serie A, however once expanded to an acceptable level it will also include other leagues.
## Installation

Clone the project

```bash
  git clone https://github.com/Hunteroni/regista-api.git
  cd regista-api
```

Create the .env file

```bash
PORT={PORT}
```

Install dependencies
```bash
npm install
```
Start the application
```bash
npm start
```



    
## API Reference

#### Standings

```
GET /standings 
```



#### Match days

```
GET /days?lang=${iso2}
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `iso2` | `string` | **Optional**. Either `en` or `it`. |



#### Get results

```
GET /results/${id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. The id of the match day. |

#### Get players

```
GET /players/${slug}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `slug`      | `string` | **Required**. The slug of the club. |


