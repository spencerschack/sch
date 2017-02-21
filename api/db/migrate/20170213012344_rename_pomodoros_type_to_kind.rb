class RenamePomodorosTypeToKind < ActiveRecord::Migration[5.0]
  def change
    rename_column :pomodoros, :type, :kind
  end
end
