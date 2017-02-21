class MakeProjectIdNullableOnTasks < ActiveRecord::Migration[5.0]
  def change
    change_column :tasks, :project_id, :integer, null: true
  end
end
