Rails.application.routes.draw do

  scope '/api' do
    resources :tasks
  end

  mount_ember_app :ui, to: '/'

end
