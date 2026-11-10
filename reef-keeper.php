<?php
/**
 * Plugin Name:       Reef Keeper
 * Description:       A virtual reef tank game for Reef Network. Add [reef_keeper] to a page. New species send players to their encyclopedia pages.
 * Version:           1.1.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Reef Network
 * Text Domain:       reef-keeper
 */

defined( 'ABSPATH' ) || exit;

define( 'REEF_KEEPER_VERSION', '1.1.0' );
define( 'REEF_KEEPER_URL', plugin_dir_url( __FILE__ ) );

require_once __DIR__ . '/includes/class-engine.php';
require_once __DIR__ . '/includes/class-settings.php';
require_once __DIR__ . '/includes/class-species.php';
require_once __DIR__ . '/includes/class-store.php';
require_once __DIR__ . '/includes/class-rest.php';
require_once __DIR__ . '/includes/class-mailer.php';

class Reef_Keeper {

	public static function init() {
		Reef_Keeper_Settings::init();
		Reef_Keeper_Species::init();
		Reef_Keeper_Rest::init();
		Reef_Keeper_Mailer::init();
		add_shortcode( 'reef_keeper', array( __CLASS__, 'shortcode' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'encyclopedia_page' ) );
	}

	private static function enqueue( $handles ) {
		$deps = array();
		foreach ( $handles as $h ) {
			wp_enqueue_script( 'reef-keeper-' . $h, REEF_KEEPER_URL . 'assets/' . $h . '.js', $deps, REEF_KEEPER_VERSION, true );
			$deps = array( 'reef-keeper-' . $h );
		}
		return end( $deps );
	}

	private static function config( $extra ) {
		$opts   = Reef_Keeper_Settings::get();
		$member = is_user_logged_in();
		$back   = rawurlencode( $opts['game_url'] );
		return array_merge(
			array(
				'lang'    => 'tr' === Reef_Keeper_Species::lang() ? 'tr' : 'en',
				'member'  => $member,
				'rest'    => esc_url_raw( rest_url( Reef_Keeper_Rest::NS . '/' ) ),
				'nonce'   => $member ? wp_create_nonce( 'wp_rest' ) : '',
				'gameUrl' => $opts['game_url'],
				'urls'    => array(
					'join'   => add_query_arg( 'redirect_to', $back, $opts['join_url'] ),
					'signIn' => add_query_arg( 'redirect_to', $back, $opts['login_url'] ),
				),
			),
			$extra
		);
	}

	private static function print_config( $handle, $config ) {
		wp_add_inline_script( $handle, 'window.RK_CONFIG = ' . wp_json_encode( $config ) . ';', 'before' );
	}

	public static function shortcode() {
		$markup = '<div id="reef-keeper" class="reef-keeper-mount"><noscript>Reef Keeper needs JavaScript.</noscript></div>';
		// SEO plugins may render content early for meta tags; set up scripts once, print markup every time.
		static $done = false;
		if ( $done ) {
			return $markup;
		}
		$done = true;

		wp_enqueue_style( 'reef-keeper', REEF_KEEPER_URL . 'assets/game.css', array(), REEF_KEEPER_VERSION );
		$last = self::enqueue( array( 'engine', 'i18n', 'looks', 'sprites', 'stores', 'game', 'boot' ) );
		$cfg  = self::config(
			array(
				'page'    => 'game',
				'mount'   => 'reef-keeper',
				'species' => Reef_Keeper_Species::all(),
			)
		);
		self::print_config( $last, $cfg );
		if ( $cfg['member'] ) {
			update_user_meta( get_current_user_id(), Reef_Keeper_Store::LANG, $cfg['lang'] );
		}
		return $markup;
	}

	/** On an encyclopedia species page, offer the reading reward. */
	public static function encyclopedia_page() {
		if ( ! function_exists( 'is_product' ) || ! is_product() ) {
			return;
		}
		$sid = Reef_Keeper_Species::sid_for_post( get_queried_object_id() );
		if ( ! $sid ) {
			return;
		}
		$extra = array(
			'page' => 'discover',
			'sid'  => $sid,
		);
		if ( is_user_logged_in() ) {
			$state = Reef_Keeper_Store::raw( get_current_user_id() );
			if ( ! $state ) {
				return;
			}
			$extra['eligible'] = in_array( $sid, $state['discovered'], true ) && ! in_array( $sid, $state['read'], true );
			if ( ! $extra['eligible'] ) {
				return;
			}
		} else {
			$extra['species'] = Reef_Keeper_Species::all();
		}
		$last = self::enqueue( array( 'engine', 'i18n', 'stores', 'discover', 'boot' ) );
		self::print_config( $last, self::config( $extra ) );
	}

	public static function activate() {
		Reef_Keeper_Mailer::schedule();
	}

	public static function deactivate() {
		Reef_Keeper_Mailer::unschedule();
	}
}

add_action( 'plugins_loaded', array( 'Reef_Keeper', 'init' ) );
register_activation_hook( __FILE__, array( 'Reef_Keeper', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Reef_Keeper', 'deactivate' ) );
