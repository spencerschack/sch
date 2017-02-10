Rails.application.routes.draw do

  scope '/api' do
    resources :tasks
  end

end
