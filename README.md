# Process TMX Files

Exported [Translation Memory eXchange (TMX) files](https://resources.gala-global.org/tbx14b/) from various translation management systems tend to be quite large. File size becomes an issue when attempting to use these files to train machine translation models. This package utilizes an [event streaming XML parser](https://github.com/jimmymcpeter/event-streaming-xml-parser-js) to quickly and efficiently process TMX files.

## Requirements

- Node.js >= v20
- ESM

## Install

`npm install process-tmx-files` to use in your package.json.

or 

`npm install -g process-tmx-files` to use the command line interface globally.

## JavaScript Usage

```js
import processTmx from 'process-tmx-files';

console.log(processTmx.fileStats({
  fileMatch: 'temp/test/*.tmx',
}));
```

### API

This package exports various functions for processing TMX files. These correspond to the CLI commands further in this document.
- `removeInfoElements`
- `fileStats`
- `searchReplaceAttributes`
- `splitFilesByTuCount`


## CLI Usage
```shell
process-tmx-files --help
```

### Available Commands

#### remove-info-elements

Remove info elements (`note` and `prop`) from TMX files.  Exported TMX files have an abundance of `note` and `prop` elements that inflate the file size.  These are usually unnecessary for MT training.

Example removing all info elements

```shell
process-tmx-files remove-info-elements -F 'in/*.tmx' -O 'out'
```

Example removing all info elements except the prop types `context_prev` and `context_next`.

```shell
process-tmx-files remove-info-elements -W 'temp' -F 'in/*.tmx' -O 'out' -K 'context_prev' -K 'context_next'
```

#### file-stats

Count the total number of `tu` elements in each TMX file.  This is useful for gathering info to use in splitting files.

```shell
process-tmx-files file-stats -W 'temp' -F 'in/*.tmx'
```

#### search-replace-attributes

Search and replace attribute values in TMX files

```shell
process-tmx-files search-replace-attributes -W 'temp' -F 'in/*.tmx' -O 'out' -T 'tuv' -A 'xml:lang' -S 'de' -V 'de-DE'
```

#### split-files-by-tu-count

Split TMX files by `tu` element count.

```shell
process-tmx-files split-files-by-tu-count -W 'temp' -F 'in/*.tmx' -D 'out'
```
