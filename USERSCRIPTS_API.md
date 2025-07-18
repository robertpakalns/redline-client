# Userscripts API
Redline Client supports simple syntax to extract metadata from `.js` files in the `scripts` directory.

## Syntax
This block of code must be placed at the start of the script:
```
// ==RedlineClientPlugin==
// @name {name}
// @description {description}
// @authors {authors}
// @category {category}
// ==RedlineClientPlugin==
```

## Example
```
// ==RedlineClientPlugin==
// @name Character texture
// @description Darkred Head & White Body
// @authors Rob, Someone
// @category Textures
// ==RedlineClientPlugin==

... your script
```