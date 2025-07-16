# frozen_string_literal: true

require "thor"
require "csv"
require "terminal-table"

class CsvTool < Thor
  desc "filter FILE", "Filter CSV by column value"
  option :column, aliases: "-c", required: true, desc: "Column name to filter by"
  option :value, aliases: "-v", required: true, desc: "Value to match"
  option :exact, type: :boolean, default: false, desc: "Exact match (default: partial match)"
  def filter(file)
    data = read_csv(file)
    headers = data.headers
    
    unless headers.include?(options[:column])
      puts "Error: Column '#{options[:column]}' not found. Available columns: #{headers.join(', ')}"
      exit 1
    end

    filtered = data.select do |row|
      if options[:exact]
        row[options[:column]] == options[:value]
      else
        row[options[:column]]&.include?(options[:value])
      end
    end

    output_table(headers, filtered)
  end

  desc "sort FILE", "Sort CSV by column"
  option :column, aliases: "-c", required: true, desc: "Column name to sort by"
  option :desc, type: :boolean, default: false, desc: "Sort in descending order"
  option :numeric, type: :boolean, default: false, desc: "Sort as numbers"
  def sort(file)
    data = read_csv(file)
    headers = data.headers

    unless headers.include?(options[:column])
      puts "Error: Column '#{options[:column]}' not found. Available columns: #{headers.join(', ')}"
      exit 1
    end

    sorted = data.sort_by do |row|
      value = row[options[:column]]
      options[:numeric] ? value.to_f : value.to_s
    end

    sorted.reverse! if options[:desc]
    output_table(headers, sorted)
  end

  desc "aggregate FILE", "Aggregate numeric column"
  option :column, aliases: "-c", required: true, desc: "Column name to aggregate"
  option :operation, aliases: "-o", required: true, desc: "Operation: sum, avg, count, min, max"
  option :group_by, aliases: "-g", desc: "Group by column (optional)"
  def aggregate(file)
    data = read_csv(file)
    headers = data.headers

    unless headers.include?(options[:column])
      puts "Error: Column '#{options[:column]}' not found. Available columns: #{headers.join(', ')}"
      exit 1
    end

    if options[:group_by] && !headers.include?(options[:group_by])
      puts "Error: Group by column '#{options[:group_by]}' not found"
      exit 1
    end

    if options[:group_by]
      perform_grouped_aggregation(data)
    else
      perform_simple_aggregation(data)
    end
  end

  desc "show FILE", "Display CSV content"
  option :limit, aliases: "-l", type: :numeric, desc: "Limit number of rows"
  def show(file)
    data = read_csv(file)
    headers = data.headers
    
    rows = data.to_a
    rows = rows.take(options[:limit]) if options[:limit]
    
    output_table(headers, rows)
  end

  desc "columns FILE", "List column names"
  def columns(file)
    data = read_csv(file)
    headers = data.headers
    
    puts "Columns in #{file}:"
    headers.each_with_index { |header, idx| puts "  #{idx + 1}. #{header}" }
  end

  private

  def read_csv(file)
    unless File.exist?(file)
      puts "Error: File '#{file}' not found"
      exit 1
    end

    CSV.read(file, headers: true)
  rescue CSV::MalformedCSVError => e
    puts "Error reading CSV: #{e.message}"
    exit 1
  end

  def output_table(headers, rows)
    table = ::Terminal::Table.new do |t|
      t.headings = headers
      rows.each do |row|
        if row.respond_to?(:fields)
          t.add_row(row.fields)
        else
          t.add_row(row)
        end
      end
    end
    puts table
  end

  def perform_simple_aggregation(data)
    values = data.map { |row| row[options[:column]].to_f }.compact
    
    result = case options[:operation]
    when "sum"
      values.sum
    when "avg"
      values.empty? ? 0 : values.sum / values.size
    when "count"
      values.size
    when "min"
      values.min
    when "max"
      values.max
    else
      puts "Error: Unknown operation '#{options[:operation]}'"
      exit 1
    end

    puts "#{options[:operation].capitalize} of '#{options[:column]}': #{result}"
  end

  def perform_grouped_aggregation(data)
    groups = data.group_by { |row| row[options[:group_by]] }
    
    results = groups.map do |group_value, rows|
      values = rows.map { |row| row[options[:column]].to_f }.compact
      
      result = case options[:operation]
      when "sum"
        values.sum
      when "avg"
        values.empty? ? 0 : values.sum / values.size
      when "count"
        values.size
      when "min"
        values.min
      when "max"
        values.max
      end
      
      [group_value, result]
    end

    table = ::Terminal::Table.new do |t|
      t.headings = [options[:group_by], "#{options[:operation].capitalize} of #{options[:column]}"]
      results.each { |row| t.add_row(row) }
    end
    puts table
  end
end