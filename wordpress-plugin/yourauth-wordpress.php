<?php
/*
Plugin Name: YourAuth Platform
Plugin URI: https://yourauth.com
Description: Integrate your authentication platform with WordPress. Supports email/password, Google SSO, and magic link authentication with automatic audit logging.
Version: 1.0.0
Author: YourAuth Team
Author URI: https://yourauth.com
License: GPL v2 or later
Text Domain: yourauth
*/

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class YourAuthWordPress {
    private $app_id;
    private $api_url;
    private $plugin_url;
    private $plugin_path;
    
    public function __construct() {
        $this->app_id = get_option('yourauth_app_id');
        $this->api_url = 'https://api.yourauth.com';
        $this->plugin_url = plugin_dir_url(__FILE__);
        $this->plugin_path = plugin_dir_path(__FILE__);
        
        $this->init();
    }
    
    public function init() {
        // Initialize plugin
        add_action('init', array($this, 'init_plugin'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        
        // Shortcodes
        add_shortcode('yourauth_login', array($this, 'login_shortcode'));
        add_shortcode('yourauth_signup', array($this, 'signup_shortcode'));
        add_shortcode('yourauth_magic_link', array($this, 'magic_link_shortcode'));
        add_shortcode('yourauth_google_login', array($this, 'google_login_shortcode'));
        add_shortcode('yourauth_logout', array($this, 'logout_shortcode'));
        add_shortcode('yourauth_user_info', array($this, 'user_info_shortcode'));
        
        // AJAX handlers
        add_action('wp_ajax_yourauth_login', array($this, 'handle_login'));
        add_action('wp_ajax_nopriv_yourauth_login', array($this, 'handle_login'));
        add_action('wp_ajax_yourauth_signup', array($this, 'handle_signup'));
        add_action('wp_ajax_nopriv_yourauth_signup', array($this, 'handle_signup'));
        add_action('wp_ajax_yourauth_magic_link', array($this, 'handle_magic_link'));
        add_action('wp_ajax_nopriv_yourauth_magic_link', array($this, 'handle_magic_link'));
        add_action('wp_ajax_yourauth_logout', array($this, 'handle_logout'));
        
        // Activation hook
        register_activation_hook(__FILE__, array($this, 'activate'));
    }
    
    public function init_plugin() {
        // Load text domain for translations
        load_plugin_textdomain('yourauth', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    public function enqueue_scripts() {
        // Enqueue main SDK script
        wp_enqueue_script(
            'yourauth-sdk',
            $this->plugin_url . 'assets/yourauth-sdk.js',
            array('jquery'),
            '1.0.0',
            true
        );
        
        // Enqueue styles
        wp_enqueue_style(
            'yourauth-styles',
            $this->plugin_url . 'assets/yourauth-styles.css',
            array(),
            '1.0.0'
        );
        
        // Localize script with configuration
        wp_localize_script('yourauth-sdk', 'yourAuthConfig', array(
            'appId' => $this->app_id,
            'apiUrl' => $this->api_url,
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yourauth_nonce'),
            'isLoggedIn' => $this->is_user_logged_in(),
            'currentUser' => $this->get_current_user_data()
        ));
        
        // Add Google Identity Services for Google Sign-In
        if (get_option('yourauth_google_enabled', false)) {
            wp_enqueue_script(
                'google-identity',
                'https://accounts.google.com/gsi/client',
                array(),
                null,
                true
            );
        }
    }
    
    public function add_admin_menu() {
        add_options_page(
            'YourAuth Settings',
            'YourAuth',
            'manage_options',
            'yourauth-settings',
            array($this, 'admin_page')
        );
    }
    
    public function admin_init() {
        register_setting('yourauth_options', 'yourauth_app_id');
        register_setting('yourauth_options', 'yourauth_google_enabled');
        register_setting('yourauth_options', 'yourauth_google_client_id');
        register_setting('yourauth_options', 'yourauth_redirect_after_login');
        register_setting('yourauth_options', 'yourauth_redirect_after_logout');
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>YourAuth Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('yourauth_options'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">App Secret Key</th>
                        <td>
                            <input type="text" name="yourauth_app_id" value="<?php echo esc_attr(get_option('yourauth_app_id')); ?>" class="regular-text" />
                            <p class="description">Get this from your YourAuth dashboard when you create an application.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Enable Google Sign-In</th>
                        <td>
                            <input type="checkbox" name="yourauth_google_enabled" value="1" <?php checked(get_option('yourauth_google_enabled'), 1); ?> />
                            <p class="description">Enable Google OAuth authentication.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Google Client ID</th>
                        <td>
                            <input type="text" name="yourauth_google_client_id" value="<?php echo esc_attr(get_option('yourauth_google_client_id')); ?>" class="regular-text" />
                            <p class="description">Your Google OAuth Client ID for Google Sign-In.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Redirect After Login</th>
                        <td>
                            <input type="text" name="yourauth_redirect_after_login" value="<?php echo esc_attr(get_option('yourauth_redirect_after_login')); ?>" class="regular-text" />
                            <p class="description">URL to redirect users after successful login (leave empty for no redirect).</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Redirect After Logout</th>
                        <td>
                            <input type="text" name="yourauth_redirect_after_logout" value="<?php echo esc_attr(get_option('yourauth_redirect_after_logout')); ?>" class="regular-text" />
                            <p class="description">URL to redirect users after logout (leave empty for no redirect).</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <h2>Shortcode Examples</h2>
            <div class="card">
                <h3>Login Form</h3>
                <code>[yourauth_login]</code>
                
                <h3>Signup Form</h3>
                <code>[yourauth_signup]</code>
                
                <h3>Magic Link Form</h3>
                <code>[yourauth_magic_link]</code>
                
                <h3>Google Sign-In Button</h3>
                <code>[yourauth_google_login]</code>
                
                <h3>Logout Button</h3>
                <code>[yourauth_logout]</code>
                
                <h3>User Information</h3>
                <code>[yourauth_user_info]</code>
            </div>
        </div>
        <?php
    }
    
    // Shortcode: Login Form
    public function login_shortcode($atts) {
        $atts = shortcode_atts(array(
            'title' => __('Login', 'yourauth'),
            'redirect' => '',
            'show_google' => 'true',
            'show_magic_link' => 'true'
        ), $atts);
        
        if ($this->is_user_logged_in()) {
            return '<p>' . __('You are already logged in.', 'yourauth') . '</p>';
        }
        
        ob_start();
        ?>
        <div class="yourauth-container">
            <h3><?php echo esc_html($atts['title']); ?></h3>
            
            <?php if ($atts['show_google'] === 'true' && get_option('yourauth_google_enabled')): ?>
                <button class="yourauth-google-login">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                    </svg>
                    <?php _e('Sign in with Google', 'yourauth'); ?>
                </button>
                
                <div class="yourauth-divider">
                    <span><?php _e('or', 'yourauth'); ?></span>
                </div>
            <?php endif; ?>
            
            <form class="yourauth-form" data-type="login" data-redirect="<?php echo esc_attr($atts['redirect']); ?>">
                <input type="email" name="email" placeholder="<?php _e('Email', 'yourauth'); ?>" required>
                <input type="password" name="password" placeholder="<?php _e('Password', 'yourauth'); ?>" required>
                <button type="submit"><?php _e('Login', 'yourauth'); ?></button>
            </form>
            
            <?php if ($atts['show_magic_link'] === 'true'): ?>
                <p class="yourauth-magic-link-text">
                    <?php _e('Don\'t have a password?', 'yourauth'); ?> 
                    <a href="#" class="yourauth-magic-link-toggle"><?php _e('Send magic link', 'yourauth'); ?></a>
                </p>
            <?php endif; ?>
            
            <div class="yourauth-message"></div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    // Shortcode: Signup Form
    public function signup_shortcode($atts) {
        $atts = shortcode_atts(array(
            'title' => __('Sign Up', 'yourauth'),
            'redirect' => '',
            'show_google' => 'true'
        ), $atts);
        
        if ($this->is_user_logged_in()) {
            return '<p>' . __('You are already logged in.', 'yourauth') . '</p>';
        }
        
        ob_start();
        ?>
        <div class="yourauth-container">
            <h3><?php echo esc_html($atts['title']); ?></h3>
            
            <?php if ($atts['show_google'] === 'true' && get_option('yourauth_google_enabled')): ?>
                <button class="yourauth-google-login">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                    </svg>
                    <?php _e('Sign up with Google', 'yourauth'); ?>
                </button>
                
                <div class="yourauth-divider">
                    <span><?php _e('or', 'yourauth'); ?></span>
                </div>
            <?php endif; ?>
            
            <form class="yourauth-form" data-type="signup" data-redirect="<?php echo esc_attr($atts['redirect']); ?>">
                <input type="text" name="username" placeholder="<?php _e('Username', 'yourauth'); ?>" required>
                <input type="email" name="email" placeholder="<?php _e('Email', 'yourauth'); ?>" required>
                <input type="password" name="password" placeholder="<?php _e('Password', 'yourauth'); ?>" required>
                <input type="password" name="confirmPassword" placeholder="<?php _e('Confirm Password', 'yourauth'); ?>" required>
                <button type="submit"><?php _e('Sign Up', 'yourauth'); ?></button>
            </form>
            
            <div class="yourauth-message"></div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    // Shortcode: Magic Link Form
    public function magic_link_shortcode($atts) {
        $atts = shortcode_atts(array(
            'title' => __('Magic Link Login', 'yourauth'),
            'redirect' => ''
        ), $atts);
        
        if ($this->is_user_logged_in()) {
            return '<p>' . __('You are already logged in.', 'yourauth') . '</p>';
        }
        
        ob_start();
        ?>
        <div class="yourauth-container">
            <h3><?php echo esc_html($atts['title']); ?></h3>
            <form class="yourauth-form" data-type="magic-link" data-redirect="<?php echo esc_attr($atts['redirect']); ?>">
                <input type="email" name="email" placeholder="<?php _e('Email', 'yourauth'); ?>" required>
                <button type="submit"><?php _e('Send Magic Link', 'yourauth'); ?></button>
            </form>
            <div class="yourauth-message"></div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    // Shortcode: Google Login Button
    public function google_login_shortcode($atts) {
        $atts = shortcode_atts(array(
            'text' => __('Sign in with Google', 'yourauth')
        ), $atts);
        
        if ($this->is_user_logged_in()) {
            return '<p>' . __('You are already logged in.', 'yourauth') . '</p>';
        }
        
        if (!get_option('yourauth_google_enabled')) {
            return '<p>' . __('Google Sign-In is not enabled.', 'yourauth') . '</p>';
        }
        
        return '<button class="yourauth-google-login">' . esc_html($atts['text']) . '</button>';
    }
    
    // Shortcode: Logout Button
    public function logout_shortcode($atts) {
        $atts = shortcode_atts(array(
            'text' => __('Logout', 'yourauth'),
            'redirect' => ''
        ), $atts);
        
        if (!$this->is_user_logged_in()) {
            return '<p>' . __('You are not logged in.', 'yourauth') . '</p>';
        }
        
        return '<button class="yourauth-logout" data-redirect="' . esc_attr($atts['redirect']) . '">' . esc_html($atts['text']) . '</button>';
    }
    
    // Shortcode: User Information
    public function user_info_shortcode($atts) {
        $atts = shortcode_atts(array(
            'show_email' => 'true',
            'show_avatar' => 'true'
        ), $atts);
        
        if (!$this->is_user_logged_in()) {
            return '<p>' . __('You are not logged in.', 'yourauth') . '</p>';
        }
        
        $user_data = $this->get_current_user_data();
        
        ob_start();
        ?>
        <div class="yourauth-user-info">
            <?php if ($atts['show_avatar'] === 'true' && !empty($user_data['profileImage'])): ?>
                <img src="<?php echo esc_url($user_data['profileImage']); ?>" alt="Profile" class="yourauth-avatar">
            <?php endif; ?>
            
            <div class="yourauth-user-details">
                <h4><?php echo esc_html($user_data['username']); ?></h4>
                <?php if ($atts['show_email'] === 'true'): ?>
                    <p><?php echo esc_html($user_data['email']); ?></p>
                <?php endif; ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    // AJAX Handler: Login
    public function handle_login() {
        check_ajax_referer('yourauth_nonce', 'nonce');
        
        $email = sanitize_email($_POST['email']);
        $password = $_POST['password'];
        
        try {
            $response = wp_remote_post($this->api_url . '/auth/login', array(
                'headers' => array('Content-Type' => 'application/json'),
                'body' => json_encode(array(
                    'email' => $email,
                    'password' => $password,
                    'appId' => $this->app_id
                ))
            ));
            
            if (is_wp_error($response)) {
                throw new Exception($response->get_error_message());
            }
            
            $result = json_decode(wp_remote_retrieve_body($response), true);
            
            if ($result['success']) {
                // Store auth data
                $this->store_auth_data($result);
                
                // AUDIT LOG SUCCESS
                $this->audit_log('USER_LOGIN_SUCCESS', array(
                    'method' => 'email_password',
                    'success' => true,
                    'userId' => $result['user']['id'],
                    'email' => $email,
                    'platform' => 'wordpress'
                ));
                
                wp_send_json_success($result);
            } else {
                // AUDIT LOG FAILURE
                $this->audit_log('USER_LOGIN_FAILED', array(
                    'method' => 'email_password',
                    'success' => false,
                    'error' => $result['errors'][0]['message'],
                    'email' => $email,
                    'platform' => 'wordpress'
                ));
                
                wp_send_json_error($result['errors']);
            }
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    // AJAX Handler: Signup
    public function handle_signup() {
        check_ajax_referer('yourauth_nonce', 'nonce');
        
        $username = sanitize_text_field($_POST['username']);
        $email = sanitize_email($_POST['email']);
        $password = $_POST['password'];
        $confirmPassword = $_POST['confirmPassword'];
        
        try {
            $response = wp_remote_post($this->api_url . '/auth/signup', array(
                'headers' => array('Content-Type' => 'application/json'),
                'body' => json_encode(array(
                    'username' => $username,
                    'email' => $email,
                    'password' => $password,
                    'confirmPassword' => $confirmPassword,
                    'acceptTerms' => true,
                    'appId' => $this->app_id
                ))
            ));
            
            if (is_wp_error($response)) {
                throw new Exception($response->get_error_message());
            }
            
            $result = json_decode(wp_remote_retrieve_body($response), true);
            
            if ($result['success']) {
                // Store auth data
                $this->store_auth_data($result);
                
                // AUDIT LOG SUCCESS
                $this->audit_log('USER_SIGNUP_SUCCESS', array(
                    'method' => 'email_password',
                    'success' => true,
                    'userId' => $result['user']['id'],
                    'email' => $email,
                    'platform' => 'wordpress'
                ));
                
                wp_send_json_success($result);
            } else {
                // AUDIT LOG FAILURE
                $this->audit_log('USER_SIGNUP_FAILED', array(
                    'method' => 'email_password',
                    'success' => false,
                    'error' => $result['errors'][0]['message'],
                    'email' => $email,
                    'platform' => 'wordpress'
                ));
                
                wp_send_json_error($result['errors']);
            }
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    // AJAX Handler: Magic Link
    public function handle_magic_link() {
        check_ajax_referer('yourauth_nonce', 'nonce');
        
        $email = sanitize_email($_POST['email']);
        
        try {
            $response = wp_remote_post($this->api_url . '/auth/requestPasswordReset', array(
                'headers' => array('Content-Type' => 'application/json'),
                'body' => json_encode(array(
                    'email' => $email,
                    'appId' => $this->app_id
                ))
            ));
            
            if (is_wp_error($response)) {
                throw new Exception($response->get_error_message());
            }
            
            $result = json_decode(wp_remote_retrieve_body($response), true);
            
            if ($result['success']) {
                // AUDIT LOG SUCCESS
                $this->audit_log('MAGIC_LINK_SENT', array(
                    'method' => 'magic_link',
                    'success' => true,
                    'email' => $email,
                    'platform' => 'wordpress'
                ));
                
                wp_send_json_success($result);
            } else {
                // AUDIT LOG FAILURE
                $this->audit_log('MAGIC_LINK_FAILED', array(
                    'method' => 'magic_link',
                    'success' => false,
                    'error' => $result['errors'][0]['message'],
                    'email' => $email,
                    'platform' => 'wordpress'
                ));
                
                wp_send_json_error($result['errors']);
            }
        } catch (Exception $e) {
            wp_send_json_error(array('message' => $e->getMessage()));
        }
    }
    
    // AJAX Handler: Logout
    public function handle_logout() {
        check_ajax_referer('yourauth_nonce', 'nonce');
        
        // AUDIT LOG
        $this->audit_log('USER_LOGOUT', array(
            'success' => true,
            'platform' => 'wordpress'
        ));
        
        // Clear auth data
        $this->clear_auth_data();
        
        wp_send_json_success(array('message' => 'Logged out successfully'));
    }
    
    // Helper: Store authentication data
    private function store_auth_data($result) {
        update_user_meta(get_current_user_id(), 'yourauth_token', $result['accessToken']);
        if (isset($result['refreshToken'])) {
            update_user_meta(get_current_user_id(), 'yourauth_refresh_token', $result['refreshToken']);
        }
        update_user_meta(get_current_user_id(), 'yourauth_user_data', $result['user']);
    }
    
    // Helper: Clear authentication data
    private function clear_auth_data() {
        delete_user_meta(get_current_user_id(), 'yourauth_token');
        delete_user_meta(get_current_user_id(), 'yourauth_refresh_token');
        delete_user_meta(get_current_user_id(), 'yourauth_user_data');
    }
    
    // Helper: Check if user is logged in
    public function is_user_logged_in() {
        $token = get_user_meta(get_current_user_id(), 'yourauth_token', true);
        return !empty($token);
    }
    
    // Helper: Get current user data
    public function get_current_user_data() {
        return get_user_meta(get_current_user_id(), 'yourauth_user_data', true);
    }
    
    // Helper: Audit logging
    private function audit_log($event_type, $metadata) {
        wp_remote_post($this->api_url . '/sdk/audit', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $this->app_id,
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode(array(
                'eventType' => $event_type,
                'metadata' => array_merge($metadata, array(
                    'timestamp' => current_time('c'),
                    'userAgent' => $_SERVER['HTTP_USER_AGENT'],
                    'ip' => $_SERVER['REMOTE_ADDR'],
                    'sdkVersion' => '1.0.0'
                ))
            ))
        ));
    }
    
    // Activation hook
    public function activate() {
        // Create default options
        if (!get_option('yourauth_app_id')) {
            add_option('yourauth_app_id', '');
        }
        if (!get_option('yourauth_google_enabled')) {
            add_option('yourauth_google_enabled', false);
        }
        if (!get_option('yourauth_google_client_id')) {
            add_option('yourauth_google_client_id', '');
        }
    }
}

// Initialize plugin
new YourAuthWordPress(); 