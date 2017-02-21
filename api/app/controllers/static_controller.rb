class StaticController < ApplicationController

  def index
    send_file Rails.root.join('public', 'index.html'), disposition: 'inline'
  end

end
