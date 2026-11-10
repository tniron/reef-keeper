<?php
/**
 * Builds the game's species list from the encyclopedia: WooCommerce products
 * in the encyclopedia category, with the care level from a JetEngine meta field.
 * IDs are the default-language product IDs, so a fish keeps its identity when
 * the visitor switches language.
 */

defined( 'ABSPATH' ) || exit;

class Reef_Keeper_Species {

	const CACHE = 'reef_keeper_species_v2_';

	public static function init() {
		add_action( 'save_post_product', array( __CLASS__, 'flush' ) );
		add_action( 'update_option_' . Reef_Keeper_Settings::OPTION, array( __CLASS__, 'flush' ) );
		add_action( 'add_option_' . Reef_Keeper_Settings::OPTION, array( __CLASS__, 'flush' ) );
	}

	public static function flush() {
		foreach ( array( 'en', 'tr', self::lang() ) as $lang ) {
			delete_transient( self::CACHE . $lang );
		}
	}

	public static function lang() {
		$lang = apply_filters( 'wpml_current_language', null );
		if ( ! $lang || 'all' === $lang ) {
			$lang = apply_filters( 'wpml_default_language', null );
		}
		return $lang ? $lang : substr( get_locale(), 0, 2 );
	}

	/** Full list for the browser, in the current language. */
	public static function all() {
		$lang   = self::lang();
		$cached = get_transient( self::CACHE . $lang );
		if ( is_array( $cached ) ) {
			return $cached;
		}
		$list = self::build( $lang );
		set_transient( self::CACHE . $lang, $list, 12 * HOUR_IN_SECONDS );
		return $list;
	}

	/** What the rules need: sid => name, slug, cat, care. Sorted by sid like the JS engine. */
	public static function catalog() {
		$catalog = array();
		foreach ( self::all() as $s ) {
			$catalog[ $s['sid'] ] = array(
				'name' => $s['name'],
				'slug' => $s['slug'],
				'cat'  => $s['cat'],
				'care' => $s['care'],
			);
		}
		ksort( $catalog, SORT_NUMERIC );
		return $catalog;
	}

	/** Default-language product ID for any translation, or 0 if it isn't a species. */
	public static function sid_for_post( $post_id ) {
		$default = apply_filters( 'wpml_default_language', null );
		$orig    = $default ? apply_filters( 'wpml_object_id', $post_id, 'product', true, $default ) : $post_id;
		$catalog = self::catalog();
		return isset( $catalog[ (string) $orig ] ) ? (string) $orig : '';
	}

	private static function build( $lang ) {
		$opts    = Reef_Keeper_Settings::get();
		$default = apply_filters( 'wpml_default_language', null );
		if ( $default ) {
			do_action( 'wpml_switch_language', $default );
		}
		$ids = get_posts(
			array(
				'post_type'        => 'product',
				'post_status'      => 'publish',
				'posts_per_page'   => 500,
				'fields'           => 'ids',
				'orderby'          => 'title',
				'order'            => 'ASC',
				'suppress_filters' => false,
				'tax_query'        => array(
					array(
						'taxonomy'         => 'product_cat',
						'field'            => 'slug',
						'terms'            => $opts['category'],
						'include_children' => true,
					),
				),
			)
		);
		if ( $default ) {
			do_action( 'wpml_switch_language', $lang );
		}

		$list = array();
		foreach ( $ids as $orig ) {
			$id   = apply_filters( 'wpml_object_id', $orig, 'product', true, $lang );
			$id   = $id ? $id : $orig;
			$slug = get_post_field( 'post_name', $orig );
			$item = array(
				'sid'  => (string) $orig,
				'name' => html_entity_decode( get_the_title( $id ), ENT_QUOTES, 'UTF-8' ),
				'sci'  => self::scientific_name( $id ),
				'slug' => $slug,
				'cat'  => self::category( $orig ),
				'care' => self::care( $orig, $opts['care_meta'] ),
				'url'  => get_permalink( $id ),
				'img'  => (string) get_the_post_thumbnail_url( $id, 'woocommerce_thumbnail' ),
			);
			$list[] = $item;
		}
		return $list;
	}

	private static function care( $id, $key ) {
		$v = get_post_meta( $id, $key, true );
		if ( is_array( $v ) ) {
			$v = reset( $v );
		}
		$v = sanitize_title( (string) $v );
		if ( 'expert' === $v ) {
			$v = 'expert-only';
		}
		return in_array( $v, Reef_Keeper_Engine::CARE, true ) ? $v : 'moderate';
	}

	private static function category( $id ) {
		$terms = get_the_terms( $id, 'product_cat' );
		$slugs = array();
		foreach ( is_array( $terms ) ? $terms : array() as $term ) {
			$slugs[] = $term->slug;
			foreach ( get_ancestors( $term->term_id, 'product_cat' ) as $parent ) {
				$p = get_term( $parent, 'product_cat' );
				if ( $p && ! is_wp_error( $p ) ) {
					$slugs[] = $p->slug;
				}
			}
		}
		$all = implode( ' ', $slugs );
		if ( false !== strpos( $all, 'coral' ) ) {
			return 'coral';
		}
		if ( preg_match( '/invertebrat|crustacean|snail|shrimp|crab|urchin|starfish/', $all ) ) {
			return 'invert';
		}
		return 'fish';
	}

	private static function scientific_name( $id ) {
		$text = get_post_field( 'post_excerpt', $id ) . ' ' . get_the_title( $id );
		if ( preg_match( '#<em>([^<]+)</em>#', $text, $m ) ) {
			return trim( $m[1] );
		}
		if ( preg_match( '/\(([A-Z][a-z]+ [a-z.]+)\)/', $text, $m ) ) {
			return $m[1];
		}
		return '';
	}
}
