task :deploy do

  require 'net/ssh'

  server = ENV['PRODUCTION_SERVER']
  user = ENV['PRODUCTION_USER']
  dir = ENV['PRODUCTION_DIRECTORY']

  output_path = Rails.root.join('public')
  `cd ../ui; ember build -e production -o #{output_path}`
  `rsync -avz --exclude=.env . #{user}@#{server}:#{dir}`

  Net::SSH.start(server, user) do |ssh|
    ssh.exec! "cd #{dir}; bundle"
    ssh.exec! "cd #{dir}; rake db:migrate"
    ssh.exec! "cd #{dir}; touch tmp/restart.txt"
  end

end
