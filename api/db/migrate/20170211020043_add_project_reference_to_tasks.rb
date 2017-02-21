class AddProjectReferenceToTasks < ActiveRecord::Migration[5.0]
  def change
    add_reference :tasks, :project, null: false, foreign_key: true
  end
end
