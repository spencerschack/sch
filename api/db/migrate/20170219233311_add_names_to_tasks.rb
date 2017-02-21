class AddNamesToTasks < ActiveRecord::Migration[5.0]
  def change
    add_column :tasks, :name, :string, null: false
  end
end
