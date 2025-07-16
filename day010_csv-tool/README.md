# CSV Tool

CSVファイルに対してフィルタリング、ソート、集計を行うコマンドラインツール

## 概要

このツールは、CSVファイルを操作するためのシンプルで強力なCLIツールです。以下の機能を提供します：

- **フィルタリング**: 特定のカラムの値でデータを絞り込み
- **ソート**: 任意のカラムでデータを並び替え（昇順/降順、文字列/数値）
- **集計**: 数値カラムの合計、平均、カウント、最小値、最大値を計算
- **グループ集計**: 特定のカラムでグループ化して集計
- **表示**: CSVの内容を見やすいテーブル形式で表示

## セットアップ方法

```bash
cd day010_csv-tool
bundle install
```

## 使い方

### 基本的な使い方

```bash
# CSVの内容を表示
./csv-tool show data.csv

# 最初の10行だけ表示
./csv-tool show data.csv --limit 10

# カラム一覧を表示
./csv-tool columns data.csv
```

### フィルタリング

```bash
# 部分一致でフィルタ
./csv-tool filter data.csv -c name -v "John"

# 完全一致でフィルタ
./csv-tool filter data.csv -c city -v "Tokyo" --exact
```

### ソート

```bash
# 文字列として昇順ソート
./csv-tool sort data.csv -c name

# 数値として降順ソート
./csv-tool sort data.csv -c age --numeric --desc
```

### 集計

```bash
# 単純な集計
./csv-tool aggregate data.csv -c price -o sum
./csv-tool aggregate data.csv -c age -o avg
./csv-tool aggregate data.csv -c id -o count

# グループ集計
./csv-tool aggregate data.csv -c sales -o sum -g department
./csv-tool aggregate data.csv -c salary -o avg -g position
```

### 実行例

sales.csvファイルの例:
```csv
department,product,sales
Electronics,Laptop,1200
Electronics,Phone,800
Clothing,Shirt,50
Clothing,Pants,80
Electronics,Tablet,600
```

```bash
# 部門ごとの売上合計
./csv-tool aggregate sample.csv -c sales -o sum -g department

# Electronicsのみ表示
./csv-tool filter sample.csv -c department -v Electronics

# 売上の高い順にソート
./csv-tool sort sample.csv -c sales --numeric --desc
```

## 改善予定

- 複数条件でのフィルタリング
- CSV出力オプション
- 複数カラムでのソート
- カスタム区切り文字のサポート