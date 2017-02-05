class UIController < ApplicationController

  def index
    @tasks = Task.order(:start)
  end

end
