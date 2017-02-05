class TasksController < ApplicationController

  def create
    task_params = params.require(:task).permit(:name)
    task_params[:start] = Time.now
    task = Task.new(task_params)
    Task.transaction do
      current_task = Task.find_by(finish: nil)
      if task.save && current_task
        current_task.update(finish: task.start)
      end
    end
    redirect_to root_url
  end

  def finish
    task = Task.find(params[:id])
    task.update(finish: Time.now)
    redirect_to root_url
  end

end
