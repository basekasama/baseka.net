# Third-party data notices / 第三者データ表示

Release data: priority-mit-20261023.1. Input hashes and fixed URLs: inverse-data-manifest.json.

## JMnedict-derived dictionary and romanization data

Copyright James William Breen / Electronic Dictionary Research and Development Group (EDRDG).
Source: https://www.edrdg.org/enamdict/enamdict_doc.html
Terms: https://www.edrdg.org/edrdg/licence.html
Licence: https://creativecommons.org/licenses/by-sa/4.0/

The Japanese dictionary in inverse-data and its romaji-data derivative are distributed under CC BY-SA 4.0. MIT references do not relicense these dictionary data.
Fixed original retrieved 2026-10-15T03:35:56.6441435+00:00; SHA-256 71E99DBDD48693078DD33E6D83661B994B3DCF82D88E8D714F9C47BE43706487.
Modifications: given-name entry selection; exclusion of full-name entries as supporting evidence; NFKC/kana/NFC normalization; deduplication by reading; calculation letters, initials, R0/R33 indexes, and optional passport-inspired spelling data. All 33,837 readings remain; 80 unsupported readings and 7 entries requiring review are limitations. No Japanese population frequencies are supplied.

## MIT priority reference lists

Source: https://github.com/shuheilocale/japanese-personal-name-dataset/tree/74d7bfd77ea0043d39a23f1188d0256182eb80b1
Fixed commit: 74d7bfd77ea0043d39a23f1188d0256182eb80b1.
Files: japanese_personal_name_dataset/dataset/first_name_man_org.csv, first_name_woman_org.csv, first_name_man_opti.csv, first_name_woman_opti.csv.
Modifications: take only the exact hiragana first column; union and deduplicate male/female org as B (9,208) and opti as C (936). Do not use the supplied romanizations, kanji columns or sex labels. H=D∩C (936); Q=D∩(C∪B) (8,244); other D readings (25,593) remain available.
The opti subset is the author's subjective selection, not measured popularity, population frequency or a demographic classifier. The published array is an empty compatibility field; the client rejects nonempty values.

MIT License

Copyright (c) 2022 shuheilocale

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## US SSA published data

Source: U.S. Social Security Administration, 2024 published baby-name counts.
Background: https://www.ssa.gov/oact/babynames/background.html
Pinned primary copy: https://raw.githubusercontent.com/dxdc/babynames/ef1ad7133de7cf6ca496249d3ae4ede2770def8f/raw/yob2024.txt
Pinned comparison copy: https://raw.githubusercontent.com/vancleve/BIO540-DWV/310a00ee5672b7f6bd823d2f35c697e3df8ca43d/yob2024.txt
The complete saved yob2024.txt copies have SHA-256 F0083AF67C48B666E938D8BB7CB5EC766C832D08359FBDAE0EDF963DBD9613FB.
29,225 spellings, combined published count 3,328,501. Optional recorded-sex selection uses original M/F counts. Both-listed names remain in either selected category. Shares are conditional on the selected source cohort, digits and initial. These are descriptive statistics, not current-population or future-prediction probabilities. Agreement with the current official file is unverified. US federal statistical data and mirror-repository software licences are distinct; no mirror software is included here.

日本語の優先表示は参照リストへの掲載の有無です。人数頻度・本人特定確率ではありません。辞書由来データのCC BY-SA 4.0と、別資料である選別用リストのMITを区別しています。
